import os
import subprocess
import shutil

import numpy as np
import matplotlib.pyplot as plt
import networkx as nx

##############################################################################
# Functions to preprocess the input
##############################################################################
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

##############################################################################
# Functions to compare against reference
##############################################################################

def fold2bp(struc, xop="(", xcl=")"):
    """Converts a dot-bracket structure into a list of base pairs.

    :param struc: dot-bracket structure.
    :param xop: opening bracket.
    :param xcl: closing bracket.
    :returns: list of base pairs.

    """
    openxs = []
    bps = []
    if struc.count(xop) != struc.count(xcl):
        return False
    for i, x in enumerate(struc):
        if x == xop:
            openxs.append(i)
        elif x == xcl:
            if len(openxs) > 0:
                bps.append((openxs.pop(), i))
            else:
                return False
    return bps

# All possible matching brackets
MATCHING_BRACKETS = [["(", ")"], ["[", "]"], ["{", "}"], ["<", ">"],
                     ["A", "a"], ["B", "a"]]
#MATCHING_BRACKETS = [["(", ")"]]
def dot2bp(struc):
    """Converts a dot-bracket structure into a list of base pairs.

    :param struc: dot-bracket structure.
    :returns: list of base pairs.

    """
    bp = []
    if not set(struc).issubset(
            set(["."]+[c for par in MATCHING_BRACKETS for c in par])
            ):
        return False
    for brackets in MATCHING_BRACKETS:
        if brackets[0] in struc:
            bpk = fold2bp(struc, brackets[0], brackets[1])
            if bpk:
                bp = bp + bpk
            else:
                return False
    return list(sorted(bp))


def bp2map(bp):
    """Converts a list of base pairs into a index map.

    :param bp: list of base pairs.
    :returns: index map.

    """
    m = {}
    for b in bp:
        m[b[0]] = b[1]
        m[b[1]] = b[0]
    return m


def compare_structures(ref_bp, pred_bp, len_seq):
    """Compare base pairs between reference and predicted structures. Gives
    common, reference only and predicted only base pairs and nucleotide matches

    :param ref_bp: reference structure.
    :param pred_bp: predicted structure.
    :param len_seq: length of the sequence.
    :returns: common, reference only, predicted only and nucleotide matches.
    """
    ref_set = set(ref_bp)
    pred_set = set(pred_bp)
    common = pred_set & ref_set
    ref_only = ref_set - pred_set
    pred_only = pred_set - ref_set

    pred_map = bp2map(pred_bp)
    ref_map = bp2map(ref_bp)
    nuc_matches = []
    for i in range(len_seq):
        if pred_map.get(i) == ref_map.get(i):
            nuc_matches.append(True)
        else:
            nuc_matches.append(False)

    connections = []
    for b in common:
        connections.append((b[0], b[1], "cm"))
    for b in pred_only:
        connections.append((b[0], b[1], "p_o"))
    for b in ref_only:
        connections.append((b[0], b[1], "r_o"))

    return connections, nuc_matches

##############################################################################
# Functions to compare against other structures
##############################################################################

def compute_colored(seq, names, basepath):
    """Compute colored structure from a sequence and a list of structures.

    :param seq: sequence.
    :param names: list of methods names.
    :param basepath: base path.

    """
    connections = {}
    has_ref = True if "Reference" in names else False
    all_pairs = set()
    met_pairs = {}
    n_met = 0
    for name in names:
        connections[name] = []
        met_pairs[name] = set()
        if has_ref:
            # Read the connections from the file and append them to the list.
            # Each line is a tuple (i, j, type), where type is "cm", "p_o" or
            # "r_o" (common, predicted only or reference only)
            if os.path.exists(f"{basepath}{name}_conn.txt"):
                with open(f"{basepath}{name}_conn.txt", "r") as f:
                    n_met += 1
                    for line in f:
                        line = line.rstrip("\n").split(",")
                        connections[name].append([int(line[0]), int(line[1]), 
                                                  line[2]])
                        all_pairs.add((int(line[0]), int(line[1])))
                        met_pairs[name].add((int(line[0]), int(line[1])))
        else:
            # Compute the connections and append them to the list
            if os.path.exists(f"{basepath}{name}.dot"):
                with open(f"{basepath}{name}.dot", "r") as f:
                    n_met += 1
                    dot = f.read().split("\n")[2]
                bp = dot2bp(dot)
                for b in bp:
                    connections[name].append([b[0], b[1], "n"])
                    all_pairs.add((b[0], b[1]))
                    met_pairs[name].add((b[0], b[1]))

    # Compute alpha values for each connection (alpha = 1 if the connection is
    # in all methods, alpha = MIN_A if the connection is in only one method)
    MIN_A, MAX_A = 0.25, 1
    #print("All pairs:", all_pairs)
    #print("Methods pairs:", met_pairs)
    #print("All connections:", connections)
    #print("Number of methods:", len(names))
    alpha = {}
    for pair in all_pairs:
        count = 0
        for name in names:
            if pair in met_pairs[name]:
                count += 1
        # Linearly interpolate between MIN_A and MAX_A
        if n_met != 1:
            alpha[pair] = (count-1)*(MAX_A-MIN_A)/(n_met-1)+MIN_A
        else:
            alpha[pair] = MAX_A


    # basepath = "/.../[session_id]/results/" but we want
    # temp_dir = "/.../[session_id]"
    temp_dir = basepath.split("/results")[0]

    for name in names:
        # Write the connections to a file
        with open(f"{basepath}{name}_conn.txt", "w") as f:
            for conn in connections[name]:
                a = alpha[(conn[0], conn[1])]
                # Writing nt1, nt2, color and alpha
                f.write(f"{conn[0]},{conn[1]},{conn[2]},{a:.3f}\n")

        #TODO: Fix this
        color_str = "f"*len(seq)

        # Draw the circular plot with the colored structure defined by alpha
        command = ["python3", "methods/draw_circ.py", "-m", name, "-t", 
                   temp_dir, "-l", color_str, "--colored"]
        if name == "Reference":
            command.append("--is_ref")
        draw_val = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        #print(f"Draw circ {name}: {draw_val}")

    return

##############################################################################
# Functions to draw the structure
##############################################################################

def draw(method, temp_dir, color_str=None):
    """Draw the structure using draw_rna and save it in results/

    :param method: method name
    :returns: status code

    """
    # Draw the structure using draw_rna. 
    # This code is based on: https://github.com/DasLab/draw_rna
    if color_str is not None:
        draw_val = subprocess.run(["python3", "methods/draw_rna/draw_all.py", 
                                   "--color_str", f"{color_str}",
                                   f"{temp_dir}/results/{method}.dot",
                                   f"{temp_dir}/results/{method}_c.svg"], 
                                  stdout = subprocess.PIPE,
                                  stderr = subprocess.PIPE)
    draw_val = subprocess.run(["python3", "methods/draw_rna/draw_all.py", 
                               f"{temp_dir}/results/{method}.dot",
                               f"{temp_dir}/results/{method}.svg"], 
                              stdout = subprocess.PIPE,
                              stderr = subprocess.PIPE)
    return draw_val


def draw_circ(method, temp_dir): 
    #def draw_circ(method, temp_dir, cm=None, r_o=None, p_o=None, color_str=None,
              #is_ref=False):
    """Draw circular plot

    :param method: method name
    :returns: status code

    """
    draw_val = subprocess.run(["python3", "methods/draw_circ.py", "-m", 
                               method, "-t", temp_dir],
                              stdout = subprocess.PIPE,
                              stderr = subprocess.PIPE)
    #print("draw_circ output for", method, ":", draw_val)

    return draw_val

