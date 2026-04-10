import subprocess, os
import methods.utils as ut

def clean_output(lines, seq_len):
    # lines[0]: Pairing index 1: [i_0, i_1...]. 
    # lines[1]: Pairing index 2: [j_0, j_1...].
    idx1_str, idx2_str = lines[0].split("[")[1], lines[1].split("[")[1]
    if len(idx1_str[:-1]) > 0: 
        idx1 = [int(i) for i in idx1_str[:-1].split(",")] 
        idx2 = [int(i) for i in idx2_str[:-1].split(",")]
    else:
        idx1 = [] 
        idx2 = []

    clean_pairs = set()
    for i, j in zip(idx1, idx2):
        if i != j:
            clean_pairs.add(tuple(sorted((i, j))))

    final_pairs = {}
    used = set()

    for i, j in sorted(clean_pairs):
        if i not in used and j not in used:
            final_pairs[i] = j
            final_pairs[j] = i
            used.add(i)
            used.add(j) 

    dotbracket = ["." for i in range(seq_len)]
    bps = []
    for i, j in final_pairs.items():
        if i < j:
            dotbracket[i] = '('
            dotbracket[j] = ')'
            bps.append((i, j))

    dotbracket = "".join(dotbracket)

    return bps, dotbracket


def run_method(sequence, params, temp_dir, ref=None):
    """Calls RNAformer method from RNAformer folder.
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    MODELS = {"Biophysical": "biophysical", "BPRNA": "bprna",
              "Intra family finetuned": "intra_family_finetuned",
              "Inter family finetuned": "inter_family_finetuned"}
    cycles = params[0]["value"]
    model = MODELS[params[1]["value"]]
    command = ["docker", "run", "--rm", "rnaformer", "-c", f"{cycles}", "-s", 
               f"{sequence}", "--state_dict",
               f"models/RNAformer_32M_state_dict_{model}.pth", "--config", 
               f"models/RNAformer_32M_config_{model}.yml"]
    val = subprocess.run(command, stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE, universal_newlines=True)
    if val.returncode == 0:
        lines = val.stdout.splitlines()
        pred_bp, dotline = clean_output(lines, len(sequence))

        with open(f"{temp_dir}/results/RNAformer.dot", 'w') as f:
            f.write("RNAformer\n")
            f.write(sequence + "\n")
            f.write(dotline + "\n")

        if ref is not None:
            ref_bp = ut.dot2bp(ref)
            conn, n_m = ut.compare_structures(ref_bp, pred_bp, len(ref))
            with open(f"{temp_dir}/results/RNAformer_conn.txt", 'w') as f:
                for i in range(len(conn)):
                    f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
            color_str = "".join(["r" if nm else "w" for nm in n_m])
        else:
            color_str = "f"*len(sequence)

        draw_val1 = ut.draw("RNAformer", temp_dir, color_str)
        draw_val2 = ut.draw_circ("RNAformer", temp_dir)
        if draw_val1.returncode != 0 or draw_val2.returncode != 0:
            return "Sequence folded incorrectly, drawing failed"
        return "OK"
    else:
        return "Error running RNAformer"
