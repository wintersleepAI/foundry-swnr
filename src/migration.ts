import { ClientDocumentMixin as ClientDocumentMixinType } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/foundry.js/clientDocumentMixin";

export type VersionString = `${number}.${number}${"" | number}${
  | ""
  | `-${string}`}`;
// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor<T> = Function & { prototype: T };
type MidMigrationError = { type: string; document: string; error: unknown };
export type UpdateData = { _id: string; [index: string]: unknown };
export type MigrationFunction<T> = (
  document: T,
  pastUpdates: UpdateData
) => UpdateData;
type MigrationData<T extends BaseClientDocCons> = {
  type: Constructor<T>;
  version: VersionString;
  sort: number;
  func: MigrationFunction<InstanceType<T>>;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseClientDocCons = ConstructorOf<foundry.abstract.Document<any, any>>;
type ClientDocumentConstructor<
  T extends BaseClientDocCons = BaseClientDocCons
> = Pick<T, keyof T> &
  Pick<typeof ClientDocumentMixin, keyof typeof ClientDocumentMixin> & {
    new (...args: ConstructorParameters<T>): InstanceType<T> &
      ClientDocumentMixinType<InstanceType<T>>;
  };

const VERSION_KEY = "systemMigrationVersion";
let newVersion: VersionString = "0.0";
Hooks.on("init", () => (newVersion = game.system.version as never));
const _allMigrations = new Array<MigrationData<ClientDocumentConstructor>>();

class MigrationError extends Error {
  constructor(
    public migration: MigrationData<ClientDocumentConstructor>,
    public capturedErrors: MidMigrationError[]
  ) {
    super(
      `Migration failed, ${capturedErrors.length} exceptions thrown for type ${migration.type.name}, version "${migration.version}", sort ${migration.sort}`
    );
  }
}

function getCurrentVersion(): VersionString {
  const version = game.settings.get("swnr", VERSION_KEY);
  if (version !== "") return version;
  setCurrentVersion();
  return newVersion;
}

async function setCurrentVersion() {
  if (game.user?.isGM) await game.settings.set("swnr", VERSION_KEY, newVersion);
}

export default async function checkAndRunMigrations(): Promise<void> {
  await loadMigrations();
  const migrations = orderedMigrations().filter((m) =>
    isNewerVersion(m.version, getCurrentVersion())
  );
  if (migrations.length === 0) return await setCurrentVersion();
  const oldVersion = await getCurrentVersion();
  if (!game.user?.isGM)
    return ui.notifications?.error(
      game.i18n.format(game.i18n.localize("swnr.migration.needsGM"), {
        count: migrations.length,
        oldVersion,
        newVersion,
      })
    );
  ui.notifications?.warn(
    game.i18n.format(game.i18n.localize("swnr.migration.start"), {
      oldVersion,
      newVersion,
    })
  );
  for await (const migration of migrations) {
    const errors = await applyMigration(migration);
    if (errors.length > 0) {
      const error = new MigrationError(migration, errors);
      ui.notifications?.error(error.message);
      console.error(error);
    }
  }
  await setCurrentVersion();
  ui.notifications?.info(
    game.i18n.format(game.i18n.localize("swnr.migration.done"), { newVersion })
  );
}
export async function loadMigrations(): Promise<void> {
  const files: string[] = await (
    await fetch("systems/swnr/migrations.json")
  ).json();
  await Promise.all(files.map((f) => import(f)));
}

export function registerMigration<Document extends ClientDocumentConstructor>(
  type: Document,
  version: VersionString,
  sort: number,
  func: MigrationFunction<InstanceType<Document>>
): void {
  if (
    !type ||
    !Object.prototype.isPrototypeOf.call(foundry.abstract.Document, type)
  )
    throw new TypeError(`${type.name} is not a Document of some sort!`);
  _allMigrations.push({ type, version, sort, func });
}

export function orderedMigrations(): readonly MigrationData<ClientDocumentConstructor>[] {
  return _allMigrations.sort((left, right) => {
    //Version sort, lowest first
    if (left.version !== right.version)
      return isNewerVersion(left.version, right.version) ? 1 : -1;
    //Sort No. order, lowest first
    if (left.sort !== right.sort) return left.sort - right.sort;
    //Prototype sort, if parent, sorted first.
    if (left.type !== right.type) {
      if (Object.prototype.isPrototypeOf.call(left.type, right.type)) return -1;
      if (Object.prototype.isPrototypeOf.call(right.type, left.type)) return 1;
    }
    return 0;
  });
}

async function applyMigration(
  migration: MigrationData<ClientDocumentConstructor>
) {
  const collections = Object.values(game).filter(
    // Block compendiums for now.
    (v) => v instanceof Collection && v.constructor !== Collection
  ) as Collection<InstanceType<ClientDocumentConstructor>>[];
  const errors = [] as MidMigrationError[];
  for await (const type of collections) {
    for await (const document of type.values()) {
      try {
        await applyMigrationTo(document, undefined, migration);
      } catch (e) {
        errors.push({
          type: type.constructor.name,
          document: document.constructor.name,
          error: e,
        });
      }
    }
  }
  return errors;
}

function isClientDocument<T extends InstanceType<BaseClientDocCons>>(
  arg: T
): arg is ClientDocumentMixinType<T> & T {
  return arg instanceof ClientDocumentMixin;
}

async function applyMigrationTo<
  B extends InstanceType<ClientDocumentConstructor>
>(
  target: B,
  updateData = { _id: target.id } as UpdateData,
  migration: MigrationData<ClientDocumentConstructor>
) {
  if (target instanceof migration.type) {
    migration.func(target, updateData);
  }
  const constructor: typeof foundry.abstract.Document = Object.getPrototypeOf(
    target
  );
  const embeddedEntities = constructor.metadata.embedded ?? {};
  for await (const [cName] of Object.entries(embeddedEntities)) {
    const updates = [] as UpdateData[];
    const collection = target.getEmbeddedCollection(cName);

    for await (const embedded of collection) {
      if (!isClientDocument(embedded)) continue;
      const eUpdate = await applyMigrationTo(embedded, undefined, migration);
      if (Object.keys(eUpdate).length > 1) updates.push(eUpdate);
    }
    target.updateEmbeddedDocuments(cName, updates);
  }
  return updateData;
}
