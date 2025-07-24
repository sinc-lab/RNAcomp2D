import os
import subprocess
import shutil

import numpy as np
import matplotlib.pyplot as plt
import networkx as nx

#from methods.svg import svg

def generateFasta(method, sequence, temp_dir):
    """Generate a fasta file with the sequence to be folded.

    :param method: method name.
    :param sequence: sequence to be folded.
    :returns: path to the generated fasta file.

    """
    filename = temp_dir + "/results/" + method + ".fasta"
    with open(filename, 'w') as f:
        f.write(f">{method}\n")
        f.write(sequence)
    return filename


def parseParameters(command, params):
    """Generate the command with the parameters.
    
    :param command: command list to be modified.
    :param params: parameters list to add to the command.
    :returns: new command list.

    """
    for param in params:
        if param["type"] == "checkbox":
            if param["value"]:
                command.append(param["param"])
        else:
            # param["type"] == "number"
            command += [param["param"], str(param["value"])]

    return command


def draw(method, temp_dir):
    """Draw the structure using draw_rna and save it in results/

    :param method: method name
    :returns: status code

    """
    #print("Drawing", method)
    # Draw the structure using draw_rna. 
    # This code is based on: https://github.com/DasLab/draw_rna
    draw_val = subprocess.run(["python3", "methods/draw_rna/draw_all.py", 
                               f"{temp_dir}/results/{method}.dot",
                               f"{temp_dir}/results/{method}.svg"], 
                              stdout = subprocess.PIPE,
                              stderr = subprocess.PIPE)
    #if draw_val.returncode == 0:
    #    os.rename(f"{method}.svg", f"{temp_dir}/results/{method}.svg")
    return draw_val


def draw_circ(method, temp_dir):
    """Draw circular plot

    :param method: method name
    :returns: status code

    """
    try:
        val = subprocess.run(["python3", "methods/draw_circ.py", "-m", method,
                              "-t", temp_dir], 
                             stdout = subprocess.PIPE, 
                             stderr = subprocess.PIPE)
        #print(val)
        return val.returncode
    except:
        return 1

