import os
from redfold import *


def main():

  [args,file1,file2]= get_args(default_config)

  if not os.path.exists(default_path):
    os.makedirs(default_path)

  if not os.path.exists(file2):
    set_config(redfold_config,file2)
  
  process_data(args, file1,file2)
  test_data(args,file2)

if __name__ == '__main__':
  main()
