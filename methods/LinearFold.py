import subprocess
import methods.utils as ut

def run_method(sequence, params, temp_dir, ref=None):
    """Calls LinearFold method from LinearFold folder.
    :param sequence: sequence to be folded
    :param params: method parameters
    :returns: status ("OK" or error message)

    """
    command = ["methods/LinearFold/linearfold", "-b", str(params[0]["value"])]
    if params[1]["value"] == "LinearFold-V":
        command.append("-V")
    echo = subprocess.Popen(['echo', sequence], stdout=subprocess.PIPE)
    val = subprocess.run(command, stdin=echo.stdout, stdout=subprocess.PIPE, 
                         stderr=subprocess.PIPE, universal_newlines=True)
    echo.stdout.close()

    if val.returncode == 0:
        lines = val.stdout.splitlines()
        #print(f" ### Lines: {lines}\n\n ###")
        with open(f"{temp_dir}/results/LinearFold.dot", 'w') as f:
            f.write("LinearFold\n")
            f.write(lines[0] + "\n")
            pred = lines[1].split(" ")[0]
            f.write(pred + "\n")

        if ref is not None:
            ref_bp = ut.dot2bp(ref)
            pred_bp = ut.dot2bp(pred)
            conn, n_m = ut.compare_structures(ref_bp, pred_bp, len(ref))
            with open(f"{temp_dir}/results/LinearFold_conn.txt", 'w') as f:
                for i in range(len(conn)):
                    f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
            color_str = "".join(["r" if nm else "w" for nm in n_m])
        else:
            color_str = "f"*len(sequence)

        draw_val1 = ut.draw("LinearFold", temp_dir, color_str)
        draw_val2 = ut.draw_circ("LinearFold", temp_dir)
        if draw_val1.returncode != 0 or draw_val2.returncode != 0:
            return "Sequence folded incorrectly, drawing failed"
    else:
        return "LinearFold failed"
    return "OK"

