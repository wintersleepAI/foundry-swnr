import yaml
import csv
import json
from os import path

class folded_str(str): pass

def change_style(style, representer):
    def new_representer(dumper, data):
        scalar = representer(dumper, data)
        scalar.style = style
        return scalar
    return new_representer
from yaml.representer import SafeRepresenter

represent_folded_str = change_style('>', SafeRepresenter.represent_str)

yaml.add_representer(folded_str, represent_folded_str)

IMG_MAP = {
  "cyberware": "systems/swnr/assets/icons/game-icons.net/item-icons/cyber-eye.svg"
}

def convert(item, itemtype):
  name = item["name"].strip()
  item["description"] = folded_str(item["description"])
  del(item["name"])
  data = {}
  for k, v in item.items():
    if isinstance(v,str):
      #print('string', v)
      if v.isdigit():
        data[k] = int(v)
      elif v.replace(".","").isdigit():
        data[k] = float(v)
      else:
        data[k] = v
  print("D:\n",data)
  print()
  res = {
    "name": name,
    "type": itemtype,
    "img" : IMG_MAP[itemtype],
    "data": data,
  }
  return res

def convert_file(input_file, out_dir, itemtype):
  with open(input_file,"r") as inf:
    items = csv.DictReader(inf)
    for x in items:
      res = convert(x, itemtype)
      print(res)
      fn = path.join(out_dir,"%s.yml" % res["name"].replace("/","-"))
      with open(fn,"w") as of:
        yaml.dump(res, of, default_flow_style=False)

if __name__ == "__main__":
  convert_file("../src/packs/csv/cwn-cyberware.csv","../src/packs/cwn-cyberware", "cyberware")
