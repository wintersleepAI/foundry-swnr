import yaml
import csv
import json
from os import path
import os
from yaml.representer import SafeRepresenter

class folded_str(str):
    pass


def change_style(style, representer):
    def new_representer(dumper, data):
        scalar = representer(dumper, data)
        scalar.style = style
        return scalar

    return new_representer

represent_folded_str = change_style(">", SafeRepresenter.represent_str)

yaml.add_representer(folded_str, represent_folded_str)

IMG_PATH = "systems/swnr/assets/icons/game-icons.net/item-icons"
IMG_MAP = {
    "shipWeapon": "sinusoidal-beam.svg",
    "shipDefense": "bubble-field.svg",
    "shipFitting": "power-generator.svg",
    "cyberware": "cyber-eye.svg",
    "focus": "reticule.svg",
    "armor": "armor-white.svg",
    "weapon": "weapon-white.svg",
    "power": "psychic-waves-white.svg",
    "skill": "book-white.svg",
    "edge": "edge.svg",
    "program": "program.svg",
    "item": "item-white.svg",
    "drone": "../../drone.png",
}


def convert(item, itemtype):
    name = item["name"].strip()
    item["description"] = folded_str(item["description"])
    del item["name"]
    data = {}
    for k, v in item.items():
        if isinstance(v, str):
            # print('string', v)
            if v.isdigit():
                data[k] = int(v)
            elif v.replace(".", "").isdigit():
                data[k] = float(v)
            elif v == "True" or v == "False":
                data[k] = bool(v)
            else:
                data[k] = v
    to_change = []
    for k in data.keys():
        if "." in k:
            to_change.append(k)
    for k in to_change:
        v = data[k]
        del data[k]
        sub, k = k.split(".")
        if sub not in data:
            data[sub] = {}
        data[sub][k] = v

    print("D:\n", data)
    print()
    res = {
        "name": name,
        "type": itemtype,
        "img": path.join(IMG_PATH,IMG_MAP[itemtype]),
        "data": data,
    }
    return res


def convert_file(input_file, out_dir, itemtype):
    if not path.exists(out_dir):
        print("Creating directory %s" % out_dir)
        os.mkdir(out_dir)
    with open(input_file, "r") as inf:
        items = csv.DictReader(inf)
        for x in items:
            res = convert(x, itemtype)
            print(res)
            fn = path.join(out_dir, "%s.yml" % res["name"].replace("/", "-"))
            with open(fn, "w") as of:
                yaml.dump(res, of, default_flow_style=False)


if __name__ == "__main__":
    # convert_file(
    #     "../src/packs/csv/cwn-cyberware.csv", "../src/packs/cwn-cyberware", "cyberware"
    # )
    conversions = [
        # shield set manually
        #("../src/packs/csv/cwn-armor.csv", "../src/packs/cwn-armor", "armor"),

        # ( "../src/packs/csv/cwn-cyberware.csv", "../src/packs/cwn-cyberware", "cyberware"),
        # ("../src/packs/csv/cwn-programs.csv", "../src/packs/cwn-program", "program"),
        # ("../src/packs/csv/cwn-weapons.csv", "../src/packs/cwn-weapons", "weapon"),
        # ("../src/packs/csv/cwn-vehicle-weapon.csv", "../src/packs/cwn-vehicle-weapons", "shipWeapon"),
        # ("../src/packs/csv/cwn-drone-fittings.csv", "../src/packs/cwn-drone-fittings", "shipFitting"),
        # ("../src/packs/csv/cwn-drones.csv", "../src/packs/cwn-drones", "drone"),
        ("../src/packs/csv/cwn-items.csv", "../src/packs/cwn-items", "item"),
        ("../src/packs/csv/cwn-fittings.csv", "../src/packs/cwn-vehicle-fittings", "shipFitting"),

    ]
    for f,p,n in conversions:
        convert_file(f,p,n)
        