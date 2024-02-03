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

def convert_file(in_file, out_dir):
    with open(in_file, "r") as f:
        for line in f:
            obj = json.loads(line)
            print(json.dumps(obj, indent=2))
        
if __name__ == "__main__":
    import sys
    convert_file(sys.argv[1], sys.argv[2])
