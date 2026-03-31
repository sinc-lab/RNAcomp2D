import subprocess, os
import methods.utils as ut

def run_method(sequence, params, temp_dir, ref=None):
    """Calls CONTRAfold method from CONTRAfold folder.
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    full_temp_dir = os.path.abspath(temp_dir)
    inputfile = ut.generateFasta("CONTRAfold", sequence, f"{temp_dir}")
    command = ["docker", "run", "--rm", "-v", f"{full_temp_dir}:/data", 
               "contrafold", "contrafold", "predict", "results/IPknot.fasta"]
    val = subprocess.run(command, stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE, universal_newlines=True)
    if val.returncode == 0:
        lines = val.stdout.splitlines()
        with open(f"{temp_dir}/results/CONTRAfold.dot", 'w') as f:
            f.write("CONTRAfold\n")
            f.write(sequence + "\n")
            f.write(lines[-1] + "\n")

        if ref is not None:
            ref_bp = ut.dot2bp(ref)
            pred_bp = ut.dot2bp(lines[-1])
            conn, n_m = ut.compare_structures(ref_bp, pred_bp, len(ref))
            with open(f"{temp_dir}/results/CONTRAfold_conn.txt", 'w') as f:
                for i in range(len(conn)):
                    f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
            color_str = "".join(["r" if nm else "w" for nm in n_m])
        else:
            color_str = "f"*len(sequence)

        draw_val1 = ut.draw("CONTRAfold", temp_dir, color_str)
        draw_val2 = ut.draw_circ("CONTRAfold", temp_dir)
        if draw_val1.returncode != 0 or draw_val2.returncode != 0:
            return "Sequence folded, but drawing failed"
        return "OK"
    else:
        return "Error running CONTRAfold"

