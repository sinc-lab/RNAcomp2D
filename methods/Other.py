import methods.utils as ut

def run_method(sequence, params, temp_dir):
    """Draws the structure obtained using other methods.
    :returns: status code ("OK" or "DRAWING ERROR")

    """
    val1 = ut.draw(params[0], temp_dir)
    val2 = ut.draw_circ(params[0], temp_dir)
    if val1.returncode != 0 or val2 != 0:
        message = "Error drawing structure. "
        message += f"Check if {params[0]} generated a valid dot-bracket."
        return message
    return "OK"
