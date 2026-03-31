import methods.utils as ut

def run_method(sequence, params, temp_dir, ref=None):
    """Draws the structure obtained using other methods.
    :returns: status code ("OK" or "DRAWING ERROR")

    """
    if ref is not None:
        pred = params[1]
        ref_bp = ut.dot2bp(ref)
        pred_bp = ut.dot2bp(pred)
        conn, n_m = ut.compare_structures(ref_bp, pred_bp, len(ref))
        with open(f"{temp_dir}/results/{params[0]}_conn.txt", 'w') as f:
            for i in range(len(conn)):
                f.write(f"{conn[i][0]},{conn[i][1]},{conn[i][2]}\n")
        color_str = "".join(["r" if nm else "w" for nm in n_m])
    else:
        color_str = "f"*len(sequence)
    val1 = ut.draw(params[0], temp_dir, color_str)
    val2 = ut.draw_circ(params[0], temp_dir)
    if val1.returncode != 0 or val2.returncode != 0:
        message = "Error drawing structure. "
        message += f"Check if {params[0]} generated a valid dot-bracket."
        return message
    return "OK"
