// Arrays of possible backgrounds, growth skills, and classes
const backgrounds = [
  "Barbarian",
  "Clergy",
  "Courtesan",
  "Criminal",
  "Dilettante",
  "Entertainer",
  "Merchant",
  "Noble",
  "Official",
  "Peasant",
  "Physician",
  "Pilot",
  "Politician",
  "Scholar",
  "Soldier",
  "Spacer",
  "Technician",
  "Thug",
  "Vagabond",
  "Worker",
];

const growthSkills = {
  Barbarian: ["+1 Any Stat", "+2 Physical", "+2 Physical", "+2 Mental"],
  Clergy: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Courtesan: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Criminal: ["+1 Any Stat", "+2 Physical", "+2 Physical", "+2 Mental"],
  Dilettante: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Entertainer: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Merchant: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Noble: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Official: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Peasant: ["+1 Any Stat", "+2 Physical", "+2 Physical", "+2 Mental"],
  Physician: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Pilot: ["+1 Any Stat", "+2 Physical", "+2 Physical", "+2 Physical"],
  Politician: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Scholar: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Soldier: ["+1 Any Stat", "+2 Physical", "+2 Physical", "+2 Mental"],
  Spacer: ["+1 Any Stat", "+2 Physical", "+2 Physical", "+2 Mental"],
  Technician: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Thug: ["+1 Any Stat", "+2 Physical", "+2 Physical", "+2 Mental"],
  Vagabond: ["+1 Any Stat", "+2 Mental", "+2 Mental", "+2 Mental"],
  Worker: ["+1 Any Stat", "+2 Physical", "+2 Physical", "+2 Mental"],
};

const classes = ["Warrior", "Expert", "Psychic"];

// Function to get a random element from an array
function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// Function to roll 3d6 for each attribute
function roll3d6() {
  return (
    Math.floor(Math.random() * 6) +
    Math.floor(Math.random() * 6) +
    Math.floor(Math.random() * 6)
  );
}

// Function to generate a random character for SWN:R
function generateRandomCharacter() {
  const randomBackground = getRandomElement(backgrounds);
  const randomGrowthSkills = getRandomElement(growthSkills[randomBackground]);
  const randomClass = getRandomElement(classes);

  const attributes = {
    strength: roll3d6(),
    dexterity: roll3d6(),
    constitution: roll3d6(),
    intelligence: roll3d6(),
    wisdom: roll3d6(),
    charisma: roll3d6(),
  };

  return {
    background: randomBackground,
    growthSkills: randomGrowthSkills,
    class: randomClass,
    attributes: attributes,
  };
}

// Example usage
const randomSWNCharacter = generateRandomCharacter();
console.log("Random SWN Character:", randomSWNCharacter);
