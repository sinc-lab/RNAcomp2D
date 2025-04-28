import argparse
import numpy as np
import matplotlib.pyplot as plt
import networkx as nx

parser = argparse.ArgumentParser()
parser.add_argument("-m", "--method", dest="method", type=str)

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


def draw_circ(method):
    """Draw circular plot

    :param method: method name
    :returns: status code

    """

    print("Drawing", method)
    with open(f"results/{method}.dot") as f:
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

    COLORS_DICT = {'A':'#F7CE5B', 'U':'#008CFF', 'G':'#FB843E', 'C':'#23CE6B'}

    # INICIALIZO EL GRAFO
    G = nx.Graph()

    # AGREGO LOS NODOS Y DEFINO LA POSICION
    G.add_nodes_from([i for i in range(len(seq))])
    pos = nx.circular_layout(G)

    # DEFINO ETIQUETAS Y COLORES PARA LOS NODOS
    labels = {i:s for i,s in enumerate(seq)}
    #colors = [DARK_COLORS[nt] if i == 0 else LIGHT_COLORS[nt] for i,nt in enumerate(seq)]
    colors = [COLORS_DICT[nt] for nt in seq]

    # AGREGO CONEXIONES DE LA SECUENCIA
    G.add_edges_from(edge_seq)
    G.add_edges_from(edge_canonicals)

    # GENERO EL GRAFICO
    NS = np.maximum(1174.78*np.exp(-0.0224 * len(seq)), 10)
    FS = np.maximum(NS//50, 6)

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
    plt.savefig(f"results/{method}_circ.svg", format='svg', transparent=True, 
                bbox_inches='tight')
    return 0

if __name__ == "__main__":
    args = parser.parse_args()
    draw_circ(args.method)
