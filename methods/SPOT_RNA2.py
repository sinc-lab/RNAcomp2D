import subprocess, os
import methods.utils as ut
import time

def get_dot_line(bpfile):
    with open(bpfile, 'r') as f:
        lines = f.readlines()
    dot_line = ""
    for line in lines:
        cols = line.split(" ")
        if cols[2] == "0":
            dot_line += "."
        else:
            if int(cols[0]) < int(cols[2]):
                dot_line += "("
            else:
                dot_line += ")"

    return dot_line

def run_method(sequence, params, temp_dir, ref=None):
    """Calls SPOT-RNA2 method
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    try:
        # Docker volumes require absolute paths
        full_temp_dir = os.path.abspath(temp_dir)

        # SPOT-RNA2 requires input in sample_run/ folder and creates output
        # there so we need to create this folder and copy the sequence there
        inputfile = ut.generateFasta("SPOT-RNA2", sequence, f"{temp_dir}")
        # Move input file to sample_run folder
        os.mkdir(f"{full_temp_dir}/sample_run/")
        os.rename(inputfile, f"{full_temp_dir}/sample_run/SPOT-RNA2.fasta")
        
        # Check if the new file exists
        if not os.path.exists(f"{full_temp_dir}/sample_run/SPOT-RNA2.fasta"):
            return "SPOT-RNA2 input file not found"

        # It is also required to create the nt_database/empty_db.fasta file,
        # which is empty.
        #os.mkdir(f"{full_temp_dir}/nt_database/")
        #with open(f"{full_temp_dir}/nt_database/empty_db.fasta", "w") as f:
        #    f.write("")

        # Run SPOT-RNA2 using docker
        start_time = time.time()

        # Uncomment the line below to run SPOT-RNA2 locally
        command = ["docker", "run", "--rm", 
                   "-v", f"{full_temp_dir}/sample_run:/SPOT-RNA2/sample_run",
                   #"-v", f"/media/EXTRA_DATA_4TB/BLASTdb/:/SPOT-RNA2/nt_database",
                   "spot_rna2:latest", "sample_run/SPOT-RNA2.fasta"]
        val = subprocess.run(command, stdout = subprocess.PIPE, 
                             stderr = subprocess.PIPE, 
                             universal_newlines = True)
        if val.returncode != 0:
            return "SPOT-RNA2 failed"

        # Copy the output file to results folder
        #outputfile = f"{temp_dir}/sample_run/SPOT-RNA2_outputs/SPOT-RNA2.bpseq"
        #if not os.path.exists(outputfile):
        #    return "SPOT-RNA2 output file not found"
        #os.rename(outputfile, f"{temp_dir}/results/SPOT-RNA2.bpseq")
        #print(f"SPOT-RNA2 output: {val.stdout}")

        dotline = val.stdout.splitlines()[-1]
        # If the first character is not a dot or parenthesis, return error
        if dotline[0] != "." and dotline[0] != "(" and dotline[0] != ")":
            return "SPOT-RNA2 failed"
        dotfile = f"{temp_dir}/results/SPOT-RNA2.dot"
        with open(dotfile, "w") as f:
            f.write("SPOT-RNA2\n")
            f.write(f"{sequence}\n")
            f.write(f"{dotline}\n")

        if ref is not None:
            ref_bp = ut.dot2bp(ref)
            pred_bp = ut.dot2bp(dotline)
            if type(pred_bp) is list:
                conn, n_m = ut.compare_structures(ref_bp, pred_bp, len(ref))
                with open(f"{temp_dir}/results/SPOT-RNA2_conn.txt", 'w') as f:
                    for i in range(len(conn)):
                        f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
                color_str = "".join(["r" if nm else "w" for nm in n_m])
            else:
                color_str = "f"*len(sequence)
        else:
            color_str = "f"*len(sequence)

        draw_val1 = ut.draw("SPOT-RNA2", temp_dir, color_str)
        draw_val2 = ut.draw_circ("SPOT-RNA2", temp_dir)
        if draw_val1.returncode != 0 or draw_val2.returncode != 0:
            return "Sequence folded, but drawing failed"
        return "OK"
    except Exception as e:
        return f"SPOT-RNA2 failed: {e}"
