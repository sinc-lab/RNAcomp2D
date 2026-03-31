import argparse
import numpy as np
import matplotlib.pyplot as plt
import networkx as nx

parser = argparse.ArgumentParser()
parser.add_argument("-m", "--method", dest="method", type=str)
parser.add_argument("-t", "--temp_dir", dest="temp_dir", type=str)
parser.add_argument("-l", "--color_list", dest="color_list", type=str, 
                    default="None")
parser.add_argument("--colored", dest="colored", action="store_true")
parser.add_argument("--is_ref", dest="is_ref", action="store_true")

def get_pairs(dot):
    """Get the pairs from the dot-brackets

    :param dot: dot-brackets string
    :returns: list of pairs.

    """
    opening = []
    pairs = []

    # loop over the string
    for i,c in enumerate(dot):

        # new ( found => push it to the stack
        if c == '(':
            opening.append(i)


        # new ) found => pop and create an entry in the dict
        elif c==')':

            # we found a ) so there must be a ( on the stack
            if not opening:
                return False
            else:
                pairs.append([opening.pop(),i])

    # return dict if stack is empty
    return pairs if not opening else False


def circular_layout_gap(G, coverage=0.9, start_angle=0):
    nodes = list(G.nodes()) 
    n = len(nodes)
    arc = 2 * np.pi * coverage
    if n > 1:
        angles = np.linspace(start_angle, start_angle + arc, n)
    else:
        angles = [start_angle]
    pos = { node: (np.cos(angle), np.sin(angle)) for node, angle in zip(nodes, angles) }
    return pos


def draw_circ(method, temp_dir):
    """Draw circular plot

    :param method: method name
    :returns: status code

    """

    #print("Drawing", method)
    with open(f"{temp_dir}/results/{method}.dot") as f:
        content = f.read().split("\n")
        seq = content[1]
        dot = content[2]
    pairs = get_pairs(dot)
    #print("Seq:", seq, len(seq))
    #print("Pairs:", np.array(pairs))

    n = 6
    fig, ax = plt.subplots(1, 1, figsize=(n,n))
    ax.set_box_aspect(True)

    edge_canonicals = np.array(pairs)# - 1
    edge_seq = np.array([[i,i+1] for i in range(1,len(seq))])-1
    #print("Edge canonicals:", edge_canonicals)
    #print("Edge sequence:", edge_seq)

    #COLORS_DICT = {'A':'#F7CE5B', 'U':'#008CFF', 'G':'#FB843E', 'C':'#23CE6B'}
    COLORS_DICT = {'A':'#F7CE5B', 'U':'#008CFF', 'G':'#F34213', 'C':'#83C5BE'}

    # INICIALIZO EL GRAFO
    G = nx.Graph()

    # AGREGO LOS NODOS Y DEFINO LA POSICION
    G.add_nodes_from([i for i in range(len(seq))])
    #pos = nx.circular_layout(G)
    pos = circular_layout_gap(G, coverage=.95)

    # DEFINO ETIQUETAS Y COLORES PARA LOS NODOS
    labels = {i:s for i,s in enumerate(seq)}
    #colors = [DARK_COLORS[nt] if i == 0 else LIGHT_COLORS[nt] for i,nt in enumerate(seq)]
    colors = [COLORS_DICT[nt] for nt in seq]

    # AGREGO CONEXIONES DE LA SECUENCIA
    G.add_edges_from(edge_seq)
    G.add_edges_from(edge_canonicals)

    # GENERO EL GRAFICO
    NS = np.maximum(1174.78*np.exp(-0.0224 * len(seq)), 10)
    FS = np.maximum(NS//35, 6)

    nx.draw_networkx_nodes(G=G, pos=pos, node_color=colors, ax=ax, 
                           node_size=NS)
    nx.draw_networkx_labels(G=G, pos=pos, labels=labels, font_size=FS, 
                            font_color='black', ax=ax)
    nx.draw_networkx_edges(G=G, pos=pos, edgelist=edge_seq, style='solid', 
                           edge_color='#646464', arrows=True, ax=ax)
    for pair in edge_canonicals:
        nt1 = int(pair[0])
        nt2 = int(pair[1])
        if (nt1 < (len(seq)//4)) and (nt2 > 3*(len(seq)//4)):
            angle = 0.2
        else:
            angle=-0.2
        nx.draw_networkx_edges(G=G, pos=pos, edgelist=[pair], 
                               style='solid', alpha=0.95, arrows=True, 
                               connectionstyle=f'arc3,rad={angle}', ax=ax)

    # Agregar etiquetas de décadas y líneas rectas
    n = len(seq)
    for i in range(0, n, 10):
        angle = 2 * np.pi * i / n
        label_pos = np.array([1.25 * np.cos(angle), 1.25 * np.sin(angle)])
        node_pos = np.array(pos[i])

        # Añadir etiqueta de década
        ax.text(label_pos[0], label_pos[1], str(i+1), fontsize=10, 
                ha='center', va='center')

        pos0 = node_pos + 0.095 * label_pos
        pos1 = node_pos + 0.135 * label_pos

        # Dibujar línea recta entre la etiqueta y el nodo
        ax.plot([pos0[0], pos1[0]], [pos0[1], pos1[1]], color='black', 
                linewidth=1)

    plt.axis('equal')
    plt.axis('off')
    plt.savefig(f"{temp_dir}/results/{method}_circ.svg", format='svg', 
                transparent=True, bbox_inches='tight')
    return 0

def draw_comparison_circ(method, temp_dir, color_str=None, is_ref=False):
    """Draw circular plot comparing a method against a reference

    :param method: method name
    :returns: status code

    """

    #print("Drawing", method)
    if color_str is None:
        color_str = "f"*len(sequence)
    with open(f"{temp_dir}/results/{method}.dot") as f:
        content = f.read().split("\n")
        seq = content[1]
    #print("Seq:", seq, len(seq))
    #print("Pairs:", np.array(pairs))

    n = 6
    fig, ax = plt.subplots(1, 1, figsize=(n,n))
    ax.set_box_aspect(True)

    edge_seq = np.array([[i,i+1] for i in range(1,len(seq))])-1
    #print("Edge canonicals:", edge_canonicals)
    #print("Edge sequence:", edge_seq)

    #COLORS_DICT = {'A':'#F7CE5B', 'U':'#008CFF', 'G':'#FB843E', 'C':'#23CE6B'}
    COLORS_DICT = {'r_o':'#C8C8C8', 'cm':'#008CFF', 'p_o':'#F34213',
                   "r":"#008CFF","w":"#F34213", "f":"#C8C8C8",
                   "n":"#000000"}
    if is_ref:
        COLORS_DICT = {'cm':'#C8C8C8', 'r_o':'#008CFF', 'p_o':'#F34213',
                       "r":"#C8C8C8","w":"#F34213", "f":"#C8C8C8",
                       "n":"#000000"}

    # INICIALIZO EL GRAFO
    G = nx.Graph()

    # AGREGO LOS NODOS Y DEFINO LA POSICION
    G.add_nodes_from([i for i in range(len(seq))])
    #pos = nx.circular_layout(G)
    pos = circular_layout_gap(G, coverage=.95)

    # DEFINO ETIQUETAS Y COLORES PARA LOS NODOS
    labels = {i:s for i,s in enumerate(seq)}
    #colors = [COLORS_DICT[nt] for nt in seq]
    colors = [COLORS_DICT[color_str[i]] for i in range(len(seq))]

    # AGREGO CONEXIONES CANONICAS
    cons, edge_canonicals = [], []
    with open(f"{temp_dir}/results/{method}_conn.txt", "r") as f:
        lines = f.read().split("\n")[:-1]
        #print("Lines:", lines)
    for line in lines:
        conn = line.split(",")
        nt1 = int(conn[0])
        nt2 = int(conn[1])
        color = conn[2]
        alpha = float(conn[3])
        cons.append([nt1, nt2, color, alpha])
        edge_canonicals.append([nt1, nt2])
    edge_canonicals = np.array(edge_canonicals)

    # AGREGO CONEXIONES DE LA SECUENCIA
    G.add_edges_from(edge_seq)
    G.add_edges_from(edge_canonicals)

    # GENERO EL GRAFICO
    NS = np.maximum(1174.78*np.exp(-0.0224 * len(seq)), 10)
    FS = np.maximum(NS//35, 6)

    # DIBUJO LOS NUCLEOTIDOS
    nx.draw_networkx_nodes(G=G, pos=pos, node_color=colors, ax=ax, 
                           node_size=NS)
    nx.draw_networkx_labels(G=G, pos=pos, labels=labels, font_size=FS, 
                            font_color='black', ax=ax)
    nx.draw_networkx_edges(G=G, pos=pos, edgelist=edge_seq, style='solid', 
                           edge_color="#646464", alpha=0.95, 
                           arrows=True, ax=ax)

    # DIBUJO LAS CONEXIONES DE LA SECUENCIA
    for conn in cons:
        nt1, nt2, color, alpha = conn
        if (nt1 < (len(seq)//4)) and (nt2 > 3*(len(seq)//4)):
            angle = 0.2
        else:
            angle=-0.2
        style = 'dashed' if color == 'r_o' else 'solid'
        #style = 'solid'
        nx.draw_networkx_edges(G=G, pos=pos, edgelist=[[nt1, nt2]], 
                               style=style, edge_color=COLORS_DICT[color], 
                               alpha=alpha, arrows=True, width=2,
                               connectionstyle=f'arc3,rad={angle}', ax=ax)

    #TODO: Fix this
    # Agregar etiquetas de décadas y líneas rectas
    n = len(seq)
    for i in range(0, n, 10):
        angle = 2 * np.pi * i / n
        label_pos = np.array([1.25 * np.cos(angle), 1.25 * np.sin(angle)])
        node_pos = np.array(pos[i])

        # Añadir etiqueta de década
        ax.text(label_pos[0], label_pos[1], str(i+1), fontsize=10, 
                ha='center', va='center')

        pos0 = node_pos + 0.095 * label_pos
        pos1 = node_pos + 0.135 * label_pos

        # Dibujar línea recta entre la etiqueta y el nodo
        ax.plot([pos0[0], pos1[0]], [pos0[1], pos1[1]], color='black', 
                linewidth=1)

    plt.axis('equal')
    plt.axis('off')
    plt.savefig(f"{temp_dir}/results/{method}_circ_c.svg", format='svg', 
                transparent=True, bbox_inches='tight')
    return 0

if __name__ == "__main__":
    args = parser.parse_args()
    if args.colored:
        draw_comparison_circ(args.method, args.temp_dir, args.color_list, 
                             args.is_ref)
    else:
        draw_circ(args.method, args.temp_dir)
