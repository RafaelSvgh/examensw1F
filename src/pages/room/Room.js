import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import * as go from "gojs";
import socket from "../../services/socket";
import "./Room.css";
import { actualizarSala } from "../../services/sala";

const { v4: uuid } = require("uuid");

const Room = () => {
  const { roomCode } = useParams();
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const diagram = useRef(null);
  const lastDiagramJson = useRef(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedLinkType, setSelectedLinkType] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Usar useMemo para estabilizar las referencias de localStorage
  const user = useMemo(() => {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  }, []);
  
  const sala = useMemo(() => {
    const salaData = localStorage.getItem("sala");
    return salaData ? JSON.parse(salaData) : null;
  }, []);
  useEffect(() => {
    if (!diagramRef.current || !paletteRef.current) return;
    diagram.current = new go.Diagram("diagrama", {
      "animationManager.isEnabled": false,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(20, 20),
      "undoManager.isEnabled": true,
      contentAlignment: go.Spot.None,
    });

    // Plantillas de nodos y enlaces
    diagram.current.nodeTemplate = new go.Node("Auto", {
      locationSpot: go.Spot.Center,
    })
      .bind(
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(
          go.Point.stringify
        )
      )
      .add(
        new go.Shape("Rectangle", {
          fill: "lightyellow", // Color por defecto
          stroke: "gray",
          portId: "",
          fromLinkable: true,
          toLinkable: true,
          cursor: "pointer",
        }).bind(
          new go.Binding("fill", "nodeType", (type) => {
            return type === "intermediate" ? "lightblue" : "lightyellow";
          })
        ),
        new go.Panel("Table", {
          defaultColumnSeparatorStroke: "black",
        }).add(
          new go.TextBlock({
            row: 0,
            columnSpan: 2,
            margin: 3,
            alignment: go.Spot.Center,
            font: "bold 12pt sans-serif",
            isMultiline: false,
            editable: true,
          }).bindTwoWay("text", "name"),
          new go.Shape("LineH", {
            row: 1,
            column: 0,
            columnSpan: 2,
            stroke: "black",
            strokeWidth: 1,
            height: 1,
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(5, 0, 5, 0),
          }),

          // Atributo editable y multilinea
          new go.TextBlock({
            row: 2,
            column: 0,
            columnSpan: 2,
            font: "italic 11pt sans-serif",
            isMultiline: true,
            editable: true,
            wrap: go.TextBlock.WrapFit,
            margin: new go.Margin(5, 5, 5, 5),
          }).bindTwoWay("text", "attribute")
        )
      );

    diagram.current.linkTemplateMap.add(
      "asociacion",
      new go.Link({
        selectionAdorned: true,
        layerName: "Background",
        reshapable: true,
        routing: go.Routing.Normal,
        corner: 5,
        // selectionAdorned: true,
        // layerName: "Background",
        // reshapable: true,
        // routing: go.Routing.AvoidsNodes,
        // corner: 5,
        // curve: go.Curve.JumpOver,
      }).add(
        new go.Shape({
          stroke: "#000000",
          strokeWidth: 2,
        }),
        new go.TextBlock({
          text: "1",
          textAlign: "center",
          font: "bold 14px sans-serif",
          stroke: "black",
          segmentIndex: 0,
          segmentOffset: new go.Point(20, NaN),
          segmentOrientation: go.Orientation.Upright,
          editable: true,
        }).bindTwoWay("text", "fromMultiplicity"),
        new go.TextBlock({
          text: "*",
          textAlign: "center",
          font: "bold 16px sans-serif",
          stroke: "black",
          segmentIndex: -1,
          segmentOffset: new go.Point(-20, NaN),
          segmentOrientation: go.Orientation.Upright,
          editable: true,
        }).bindTwoWay("text", "toMultiplicity")
      )
    );

    diagram.current.linkTemplateMap.add(
      "muchos-a-muchos",
      new go.Link({
        selectionAdorned: true,
        layerName: "Background",
        reshapable: true,
        routing: go.Routing.Normal,
        corner: 5,
      }).add(
        new go.Shape({
          stroke: "#000000",
          strokeWidth: 2,
        }),
        new go.TextBlock({
          text: "*",
          textAlign: "center",
          font: "bold 14px sans-serif",
          stroke: "black",
          segmentIndex: 0,
          segmentOffset: new go.Point(20, NaN),
          segmentOrientation: go.Orientation.Upright,
          editable: true,
        }).bindTwoWay("text", "fromMultiplicity")
      )
    );

    diagram.current.linkTemplateMap.add(
      "recursivo",
      new go.Link({
        routing: go.Routing.Orthogonal,
        corner: 5,
        reshapable: true,
      }).add(new go.Shape({ strokeWidth: 2, stroke: "black" }))
    );

    diagram.current.linkTemplateMap.add(
      "generalizacion",
      new go.Link({
        routing: go.Routing.Normal,
        corner: 5,
      }).add(
        new go.Shape({ strokeWidth: 2, stroke: "black" }),
        new go.Shape({
          toArrow: "Triangle",
          fill: "white",
          stroke: "black",
          strokeWidth: 1,
          scale: 1.5,
        })
      )
    );

    diagram.current.linkTemplateMap.add(
      "agregacion",
      new go.Link({
        routing: go.Routing.Normal,
        corner: 5,
      }).add(
        new go.Shape({ strokeWidth: 2, stroke: "black" }),
        new go.Shape({
          toArrow: "Diamond",
          fill: "white",
          stroke: "black",
          strokeWidth: 1,
          scale: 1.5,
        })
      )
    );

    diagram.current.linkTemplateMap.add(
      "composicion",
      new go.Link({
        routing: go.Routing.Normal,
        corner: 5,
      }).add(
        new go.Shape({ strokeWidth: 2, stroke: "black" }),
        new go.Shape({
          toArrow: "Diamond",
          fill: "black",
          stroke: "black",
          strokeWidth: 1,
          scale: 1.5,
        })
      )
    );

    // Paleta
    const palette = new go.Palette(paletteRef.current, {
      nodeTemplate: diagram.current.nodeTemplate,
      model: new go.GraphLinksModel([
        {
          key: uuid(),
          name: "Clase",
          attribute: "atributo1: tipo\natributo2: tipo",
          loc: "0 0",
          nodeType: "standard",
        },
      ]),
    });
    let isSocketUpdate = false;
    // Escuchar selección de enlaces
    diagram.current.addDiagramListener("LinkDrawn", (e) => {
      if (isSocketUpdate) return;
      const link = e.subject;
      const model = diagram.current.model;
      model.setDataProperty(link.data, "fromMultiplicity", "1");
      model.setDataProperty(link.data, "toMultiplicity", "*");
      setSelectedLink(link);
    });

    // Actualiza el enlace
    diagram.current.addDiagramListener("ObjectSingleClicked", (e) => {
      if (isSocketUpdate) return;
      const part = e.subject.part;
      if (part instanceof go.Link) {
        setSelectedLink(part);
        const linkCategory = part.data.category || "asociacion";
        setSelectedLinkType(linkCategory);
      }
    });

    if (sala?.id) {
      socket.emit("reconectar-a-sala", sala.id);
    }
    // socket.emit("reconectar-a-sala", sala.id);
    // socket.on("cargar-diagrama", (payload) => {
    //   diagram.current.model = go.Model.fromJson(payload);
    // });

    socket.on("reconectar-a-sala", (payload) => {
      isSocketUpdate = true;
      diagram.current.model = go.Model.fromJson(payload);
      isSocketUpdate = false;
    });

    // actualizar titulo, atributo, multiplicidad
    diagram.current.addModelChangedListener(function (evt) {
      const json = diagram.current.model.toJson();
      if (evt.change === go.ChangeType.Property) {
        if (evt.propertyName === "name" && json !== lastDiagramJson.current) {
          lastDiagramJson.current = json;
          if (!isSocketUpdate) {
            socket.emit("actualizar-titulo", {
              room: roomCode,
              key: evt.object.key,
              texto: evt.newValue,
            });
          }
        }
      }

      if (
        evt.change === go.ChangeType.Property &&
        evt.propertyName === "attribute" &&
        json !== lastDiagramJson.current
      ) {
        lastDiagramJson.current = json;
        if (!isSocketUpdate) {
          socket.emit("actualizar-atributo", {
            room: roomCode,
            key: evt.object.key,
            texto: evt.newValue,
          });
        }
      }

      if (evt.change === go.ChangeType.Property) {
        if (evt.propertyName === "fromMultiplicity") {
          if (!isSocketUpdate) {
            const { from, to } = evt.object;
            socket.emit("actualizar-multiplicidad", {
              room: roomCode,
              from: from,
              to: to,
              updatedText: evt.newValue,
              propertyChanged: "fromMultiplicity",
            });
          }
        }

        if (evt.propertyName === "toMultiplicity") {
          if (!isSocketUpdate) {
            const { from, to } = evt.object;
            socket.emit("actualizar-multiplicidad", {
              room: roomCode,
              from: from,
              to: to,
              updatedText: evt.newValue,
              propertyChanged: "toMultiplicity",
            });
          }
        }
      }
    });

    // escuchar si un nodo nuevo ingresa al diagrama
    diagram.current.addDiagramListener(
      "ExternalObjectsDropped",
      function (evt) {
        if (!isSocketUpdate) {
          const nodo = evt.subject.toArray()[0].data;
          socket.emit("nuevo-nodo", {
            room: roomCode,
            nodo: nodo,
          });
        }
      }
    );

    // escuchar si un nodo se ha movido
    diagram.current.addDiagramListener("SelectionMoved", function (e) {
      if (!isSocketUpdate) {
        e.subject.each(function (part) {
          if (part instanceof go.Node) {
            const movedNodeData = part.data;
            socket.emit("nodo-movido", {
              room: roomCode,
              key: movedNodeData.key,
              loc: movedNodeData.loc,
            });
          }
        });
      }
    });

    // crear un nuevo enlace
    diagram.current.addDiagramListener("LinkDrawn", (evt) => {
      const newLink = evt.subject.part.data;
      if (!newLink.category) {
        diagram.current.model.startTransaction("Categoría por defecto");
        diagram.current.model.setCategoryForLinkData(newLink, "asociacion");
        diagram.current.model.commitTransaction("Categoría por defecto");
      }

      if (!isSocketUpdate) {
        const newLink = evt.subject;
        const linkData = newLink.data;
        socket.emit("nuevo-enlace", {
          room: roomCode,
          link: {
            from: linkData.from,
            to: linkData.to,
            fromMultiplicity: linkData.fromMultiplicity,
            toMultiplicity: linkData.toMultiplicity,
            category: linkData.category,
          },
        });
      }
    });

    diagram.current.addDiagramListener("ObjectSingleClicked", (e) => {
      if (isSocketUpdate) return;
      const part = e.subject.part;
      if (part instanceof go.Node) {
        setSelectedNode(part.data);
      }
    });

    //eliminar nodo y enlace
    diagram.current.addDiagramListener("SelectionDeleted", (e) => {
      if (!isSocketUpdate) {
        const removedParts = e.subject.toArray();
        removedParts.forEach((part) => {
          if (part instanceof go.Node) {
            const nodeData = part.data;
            socket.emit("nodo-eliminado", {
              room: roomCode,
              nodeKey: nodeData.key,
            });
          } else if (part instanceof go.Link) {
            const linkData = part.data;
            socket.emit("enlace-eliminado", {
              room: roomCode,
              from: linkData.from,
              to: linkData.to,
            });
          }
        });
      }
    });

    /* ACTUALIZACIONES DEL DIAGRAMA CON SOCKETS*/
    socket.on("agregar-nodo", (payload) => {
      isSocketUpdate = true;
      if (diagram.current) {
        diagram.current.startTransaction("Agregar nuevo nodo");
        diagram.current.model.addNodeData(payload);
        diagram.current.commitTransaction("Agregar nuevo nodo");
      }
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("titulo-actualizado", (payload) => {
      isSocketUpdate = true;
      const nodo = diagram.current.findNodeForKey(payload.key);
      if (nodo !== null && diagram.current) {
        diagram.current.startTransaction("Actualizar Título Nodo");
        diagram.current.model.setDataProperty(nodo.data, "name", payload.texto);
        diagram.current.commitTransaction("Actualizar Título Nodo");
      }
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("atributo-actualizado", (payload) => {
      isSocketUpdate = true;
      const nodo = diagram.current.findNodeForKey(payload.key);
      if (nodo !== null && diagram.current) {
        diagram.current.startTransaction("Actualizar Atributo Nodo");
        diagram.current.model.setDataProperty(
          nodo.data,
          "attribute",
          payload.texto
        );
        diagram.current.commitTransaction("Actualizar Atributo Nodo");
      }
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("mover-nodo", (payload) => {
      isSocketUpdate = true;
      const nodo = diagram.current.model.findNodeDataForKey(payload.key);
      if (nodo !== null && diagram.current) {
        diagram.current.model.startTransaction("Mover nodo");
        diagram.current.model.setDataProperty(nodo, "loc", payload.loc);
        diagram.current.model.commitTransaction("Mover nodo");
      }
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("agregar-enlace", (payload) => {
      isSocketUpdate = true;
      diagram.current.model.startTransaction("Agregar enlace");
      const existingLink = diagram.current.model.linkDataArray.find(
        (link) =>
          link.from === payload.from &&
          link.to === payload.to &&
          link.category === payload.category
      );
      if (!existingLink) {
        diagram.current.model.addLinkData({
          from: payload.from,
          to: payload.to,
          fromMultiplicity: payload.fromMultiplicity,
          toMultiplicity: payload.toMultiplicity,
          category: payload.category,
        });
      }
      diagram.current.model.commitTransaction("Agregar enlace");
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("enlace-actualizado", (payload) => {
      isSocketUpdate = true;
      diagram.current.startTransaction("updateLink");
      const allLinks = diagram.current.model.linkDataArray;
      const link = allLinks.find(
        (l) => l.from === payload.from && l.to === payload.to
      );
      if (link) {
        diagram.current.model.setCategoryForLinkData(link, payload.category);
      } else {
        console.error("Enlace no encontrado:", payload);
      }
      diagram.current.commitTransaction("updateLink");
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("actualizar-muchos-a-muchos", (payload) => {
      if (isSocketUpdate) return;
      isSocketUpdate = true;
      const { from, to, newNodeKey, newNode } = payload;
      const allLinks = diagram.current.model.linkDataArray;
      diagram.current.model.startTransaction(
        "Agregar relacion muchos a muchos"
      );
      diagram.current.model.addNodeData(newNode);
      let existingLink = diagram.current.model.linkDataArray.find(
        (link) =>
          link.from === from &&
          link.to === newNodeKey &&
          link.category === "muchos-a-muchos"
      );
      if (!existingLink) {
        diagram.current.model.addLinkData({
          from: from,
          to: newNodeKey,
          category: "muchos-a-muchos",
        });
      }
      existingLink = diagram.current.model.linkDataArray.find(
        (link) =>
          link.from === to &&
          link.to === newNodeKey &&
          link.category === "muchos-a-muchos"
      );
      if (!existingLink) {
        diagram.current.model.addLinkData({
          from: to,
          to: newNodeKey,
          category: "muchos-a-muchos",
        });
      }
      const link = allLinks.find((l) => l.from === from && l.to === to);
      diagram.current.model.removeLinkData(link);
      diagram.current.commitTransaction("Agregar relacion muchos a muchos");
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("enlace-recursivo-agregado", (payload) => {
      isSocketUpdate = true;
      diagram.current.startTransaction("addRecursiveLink");
      const existingLink = diagram.current.model.linkDataArray.find(
        (link) =>
          link.from === payload.key &&
          link.to === payload.key &&
          link.category === "recursivo"
      );
      if (!existingLink) {
        diagram.current.model.addLinkData({
          from: payload.key,
          to: payload.key,
          category: "recursivo",
        });
      }
      diagram.current.commitTransaction("addRecursiveLink");
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("nodo-eliminado", (payload) => {
      isSocketUpdate = true;
      const { nodeKey } = payload;
      const node = diagram.current.model.findNodeDataForKey(nodeKey);
      if (node) {
        diagram.current.model.removeNodeData(node);
      }
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("enlace-eliminado", (payload) => {
      isSocketUpdate = true;
      const { from, to } = payload;
      const link = diagram.current.model.linkDataArray.find(
        (l) => l.from === from && l.to === to
      );
      if (link) {
        diagram.current.model.removeLinkData(link);
      }
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    socket.on("actualizar-multiplicidad", (payload) => {
      isSocketUpdate = true;
      const { from, to, updatedText, propertyChanged } = payload;
      const link = diagram.current.model.linkDataArray.find(
        (l) => l.from === from && l.to === to
      );
      if (link) {
        diagram.current.model.startTransaction("Actualizar multiplicidad");
        if (propertyChanged === "fromMultiplicity") {
          diagram.current.model.setDataProperty(
            link,
            "fromMultiplicity",
            updatedText
          );
        } else if (propertyChanged === "toMultiplicity") {
          diagram.current.model.setDataProperty(
            link,
            "toMultiplicity",
            updatedText
          );
        }
        diagram.current.model.commitTransaction("Actualizar multiplicidad");
      }
      const json = diagram.current.model.toJson();
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: json });
      isSocketUpdate = false;
    });

    if (user && user.rol === "admin") {
      if (sala?.diagrama) {
        diagram.current.model = go.Model.fromJson(sala.diagrama);
      }
    }
    console.log("perro");

    return () => {
      diagram.current.div = null;
      palette.div = null;
      socket.off("agregar-nodo");
      socket.off("titulo-actualizado");
      socket.off("atributo-actualizado");
      socket.off("mover-nodo");
      socket.off("agregar-enlace");
      socket.off("enlace-actualizado");
      socket.off("actualizar-muchos-a-muchos");
      socket.off("enlace-recursivo-agregado");
      socket.off("nodo-eliminado");
      socket.off("enlace-eliminado");
      socket.off("actualizar-multiplicidad");
    };
  }, [roomCode, user, sala]);
  const handleAddRecursiveLink = () => {
    if (selectedNode) {
      diagram.current.startTransaction("addRecursiveLink");

      // Añadir un enlace desde el nodo a sí mismo (recursivo)
      diagram.current.model.addLinkData({
        from: selectedNode.key,
        to: selectedNode.key,
        category: "recursivo", // O el tipo de relación que prefieras
      });
      socket.emit("agregar-enlace-recursivo", {
        room: roomCode,
        nodo: selectedNode,
      });
      diagram.current.commitTransaction("addRecursiveLink");
    }
  };

  // Función para manejar el cambio de tipo de relación
  const handleRelationChange = (event) => {
    const selectedType = event.target.value;

    if (selectedLink) {
      diagram.current.startTransaction("changeLinkType");

      // Cambiar la plantilla del enlace basado en la selección
      switch (selectedType) {
        case "asociacion":
          diagram.current.model.setCategoryForLinkData(
            selectedLink.data,
            "asociacion"
          );
          break;
        case "generalizacion":
          diagram.current.model.setCategoryForLinkData(
            selectedLink.data,
            "generalizacion"
          );
          break;
        case "composicion":
          diagram.current.model.setCategoryForLinkData(
            selectedLink.data,
            "composicion"
          );
          break;
        case "agregacion":
          diagram.current.model.setCategoryForLinkData(
            selectedLink.data,
            "agregacion"
          );
          break;
        case "muchos-a-muchos":
          // Lógica para muchos a muchos
          createManyToManyRelation(selectedLink);
          break;
        default:
          break;
      }

      diagram.current.commitTransaction("changeLinkType");

      // Actualizar el estado para reflejar el nuevo tipo de enlace seleccionado
      setSelectedLinkType(selectedType);

      const linkData = {
        from: selectedLink.data.from,
        to: selectedLink.data.to,
        category: selectedType, // Aquí se envía la nueva categoría del enlace
      };
      // Emitir el cambio al servidor
      socket.emit("actualizar-enlace", { room: roomCode, link: linkData });
    }
  };

  const generateUniqueKey = () => {
    return Math.floor(Date.now() + Math.random() * 10000);
  };

  const handleGuardarDiagrama = async () => {
    if (user.rol !== "admin") return;
    const diagramaJson = diagram.current.model.toJson();
    const token = localStorage.getItem("authToken");
    try {
      const salaAct = await actualizarSala(token, roomCode, diagramaJson);
      localStorage.setItem("sala", JSON.stringify(salaAct));
      const salaJson = JSON.stringify(salaAct.diagrama);
      socket.emit("enviar-diagrama", { room: roomCode, diagrama: salaJson });
      console.log("Diagrama guardado con éxito", salaJson);
    } catch (error) {
      console.error("Error al guardar el diagrama:", error);
    }
  };

  const createManyToManyRelation = (link) => {
    if (link) {
      const { from, to } = link.data; // Obtener nodos de origen y destino

      // Crear un nuevo nodo intermedio
      const newNode = {
        key: generateUniqueKey(), // Asegúrate de tener una función que genere una clave única
        name: "Nodo Intermedio",
        attributes: "-", // Puedes agregar atributos aquí si es necesario
        loc: "0 0", // Establecer una ubicación adecuada
        nodeType: "intermediate", // Indicar que este nodo es intermedio
      };

      diagram.current.model.addNodeData(newNode);

      // Añadir enlaces entre los nodos existentes y el nodo intermedio
      diagram.current.model.addLinkData({
        from: from,
        to: newNode.key,
        category: "muchos-a-muchos", // Usa la categoría que prefieras
      });

      diagram.current.model.addLinkData({
        from: to,
        to: newNode.key,
        category: "muchos-a-muchos", // Usa la categoría que prefieras
      });

      // Eliminar el enlace original
      diagram.current.model.removeLinkData(link.data);
      socket.emit("crear-relacion-muchos-a-muchos", {
        room: roomCode,
        from: from,
        to: to,
        newNodeKey: newNode.key,
        newNode: newNode, // Enviar el nuevo nodo creado
      });
    }
  };

  // Función para exportar el diagrama a JSON
  const exportToJson = () => {
    if (diagram.current) {
      const json = diagram.current.model.toJson();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagrama.json"; // Nombre del archivo a descargar
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="room">
      <div className="panel-izq">
        <div ref={paletteRef} className="paleta" id="paleta"></div>
        <div className="area-trabajo">
          <button className="btn-json" id="export-json" onClick={exportToJson}>
            Exportar Json
          </button>
          <div className="link">
            <label>Tipo de Relación:</label>
            <select value={selectedLinkType} onChange={handleRelationChange}>
              <option value="generalizacion">Generalizacion</option>
              <option value="composicion">Composición</option>
              <option value="agregacion">Agregación</option>
              <option value="asociacion">Asociacion</option>
              <option value="muchos-a-muchos">Muchos a muchos</option>
            </select>
          </div>
          <button className="rec-link" onClick={handleAddRecursiveLink}>
            Enlace Recursivo
          </button>
          <button className="atri" onClick={() => handleGuardarDiagrama()}>
            Guardar Diagrama
          </button>
          <button className="rec-link" onClick={() => handleGuardarDiagrama()}>
            Generar Sprint Boot
          </button>
        </div>
      </div>
      <div ref={diagramRef} className="diagrama" id="diagrama"></div>
    </div>
  );
};

export default Room;
