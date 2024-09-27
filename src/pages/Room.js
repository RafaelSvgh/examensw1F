// import React, { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom";
// import * as go from "gojs";
// import "./Room.css";
// import socket from "./services/socket";

// const Room = () => {
//   const { roomCode } = useParams();
//   const diagramRef = useRef(null);
//   const paletteRef = useRef(null);
//   const diagram = useRef(null);
//   const lastDiagramJson = useRef(null);
//   const [selectedLink, setSelectedLink] = useState(null);

//   useEffect(() => {
//     if (!diagramRef.current || !paletteRef.current) return;

//     diagram.current = new go.Diagram("diagrama", {
//       "animationManager.isEnabled": false,
//       "grid.visible": true,
//       "grid.gridCellSize": new go.Size(20, 20),
//       "undoManager.isEnabled": true,
//       initialAutoScale: go.Diagram.None, // Desactivar ajuste automático
//       contentAlignment: go.Spot.None,
//     });

//     diagram.current.nodeTemplate = new go.Node("Auto", {
//       locationSpot: go.Spot.Center, // Importante para definir el centro del nodo
//     })
//       .bind(
//         new go.Binding("location", "loc", go.Point.parse).makeTwoWay(
//           go.Point.stringify
//         )
//       )
//       .add(
//         new go.Shape("Rectangle", {
//           fill: "lightyellow",
//           stroke: "gray",
//           portId: "",
//           fromLinkable: true,
//           toLinkable: true,
//           cursor: "pointer",
//         }),
//         new go.Panel("Table", { defaultColumnSeparatorStroke: "black" }).add(
//           new go.TextBlock({
//             row: 0,
//             columnSpan: 2,
//             margin: 3,
//             alignment: go.Spot.Center,
//             font: "bold 12pt sans-serif",
//             isMultiline: false,
//             editable: true,
//           }).bindTwoWay("text", "name"),
//           new go.TextBlock({
//             row: 1,
//             column: 0,
//             margin: 3,
//           }).bind("text", "attributes")
//         )
//       );

//     diagram.current.linkTemplate = new go.Link({
//       selectionAdorned: true,
//       layerName: "Background",
//       reshapable: true,
//       routing: go.Routing.Normal,
//       corner: 5,
//     }).add(
//       new go.Shape({
//         stroke: "#000000",
//         strokeWidth: 2,
//       }),
//       new go.TextBlock({
//         text: "1..*",
//         textAlign: "center",
//         font: "bold 14px sans-serif",
//         stroke: "black",
//         segmentIndex: 0,
//         segmentOffset: new go.Point(20, NaN),
//         segmentOrientation: go.Orientation.Upright,
//         editable: true,
//       }).bindTwoWay("text", "fromMultiplicity"), // bindTwoWay para permitir la edición
//       new go.TextBlock({
//         text: "1..*",
//         textAlign: "center",
//         font: "bold 14px sans-serif",
//         stroke: "black",
//         segmentIndex: -1,
//         segmentOffset: new go.Point(-20, NaN),
//         segmentOrientation: go.Orientation.Upright,
//         editable: true,
//       }).bindTwoWay("text", "toMultiplicity") // bindTwoWay para permitir la edición
//     );

//     const palette = new go.Palette(paletteRef.current, {
//       nodeTemplate: diagram.current.nodeTemplate,
//       model: new go.GraphLinksModel([
//         { key: 1, name: "New Class", attributes: "attr" },
//       ]),
//     });

//     diagram.current.addDiagramListener("ObjectSingleClicked", (e) => {
//       const part = e.subject.part;
//       if (part instanceof go.Link) {
//         setSelectedLink(part); // Almacenar el enlace seleccionado en el estado
//       }
//     });

//     diagram.current.addDiagramListener("SelectionMoved", (e) => {
//       e.subject.each((part) => {
//         if (part instanceof go.Node) {
//           const loc = part.location;
//           diagram.current.model.setDataProperty(
//             part.data,
//             "loc",
//             go.Point.stringify(loc)
//           ); // Actualizar el modelo con la nueva posición
//         }
//       });
//     });

//     diagram.current.addDiagramListener("LinkDrawn", (e) => {
//       const link = e.subject; // El enlace recién creado
//       const model = diagram.current.model;
//       model.setDataProperty(link.data, "fromMultiplicity", "1");
//       model.setDataProperty(link.data, "toMultiplicity", "1");
//     });

//     diagram.current.addModelChangedListener((e) => {
//       if (e.isTransactionFinished && diagram.current) {
//         const json = diagram.current.model.toJson();
//         if (json !== lastDiagramJson.current) {
//           lastDiagramJson.current = json; // Actualizar el último JSON
//           socket.emit("actualizar-diagrama", {
//             room: roomCode,
//             diagrama: json,
//           });
//         }
//       }
//     });

//     socket.on("diagrama-actualizado", (json_diagrama) => {
//       if (diagram.current) {
//         diagram.current.model = go.Model.fromJson(json_diagrama);
//       }
//     });

//     return () => {
//       diagram.current.div = null;
//       palette.div = null;
//       socket.off("diagrama-actualizado"); // Limpiar el evento del socket al desmontar
//     };
//   }, [roomCode]); // Agrega roomCode como dependencia

//   const handleRelationChange = (event) => {
//     if (selectedLink) {
//       const type = event.target.value;
//       diagram.current.startTransaction("change relation type");

//       switch (type) {
//         case "dependencia":
//           selectedLink.routing = go.Routing.Orthogonal;
//           selectedLink.curve = go.Link.Bezier;
//           selectedLink.getLinkPoint = go.Link.getLinkPoint;
//           selectedLink.fromArrow = "OpenTriangle";
//           selectedLink.toArrow = "";
//           break;
//         case "herencia":
//           selectedLink.routing = go.Routing.Normal;
//           selectedLink.fromArrow = "Triangle";
//           selectedLink.toArrow = "";
//           break;
//         case "composicion":
//           selectedLink.fromArrow = "Diamond";
//           selectedLink.toArrow = "";
//           break;
//         case "agregacion":
//           selectedLink.fromArrow = "OpenDiamond";
//           selectedLink.toArrow = "";
//           break;
//         default:
//           selectedLink.fromArrow = "";
//           selectedLink.toArrow = "";
//       }

//       diagram.current.commitTransaction("change relation type");
//     }
//   };

//   // Función para exportar el diagrama a JSON
//   const exportToJson = () => {
//     if (diagram.current) {
//       const json = diagram.current.model.toJson();
//       const blob = new Blob([json], { type: "application/json" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = "diagrama.json"; // Nombre del archivo a descargar
//       a.click();
//       URL.revokeObjectURL(url);
//     }
//   };

//   // Función para importar JSON y cargar el diagrama
//   const importFromJson = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const jsonData = e.target.result;
//         diagram.current.model = go.Model.fromJson(jsonData);
//       };
//       reader.readAsText(file);
//     }
//   };

//   return (
//     <div className="room">
//       <div className="panel-izq">
//         <div ref={paletteRef} className="paleta" id="paleta"></div>
//         <div className="area-trabajo">
//           <button className="btn-json" id="export-json" onClick={exportToJson}>
//             Exportar Json
//           </button>
//           <input type="file" accept=".json" onChange={importFromJson} />
//           <div className="link">
//             <label>Tipo de Relación:</label>
//             <select onChange={handleRelationChange}>
//               <option value="dependencia">Dependencia</option>
//               <option value="herencia">Herencia</option>
//               <option value="composicion">Composición</option>
//               <option value="agregacion">Agregación</option>
//             </select>
//           </div>
//         </div>

//       </div>

//       <div ref={diagramRef} className="diagrama" id="diagrama"></div>
//     </div>
//   );
// };

// export default Room;
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as go from "gojs";
import "./Room.css";
import socket from "../services/socket";

const Room = () => {
  const { roomCode } = useParams();
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const diagram = useRef(null);
  const lastDiagramJson = useRef(null);
  const [selectedLink, setSelectedLink] = useState(null); // Estado para el enlace seleccionado
  const [selectedLinkType, setSelectedLinkType] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  useEffect(() => {
    if (!diagramRef.current || !paletteRef.current) return;
    diagram.current = new go.Diagram("diagrama", {
      "animationManager.isEnabled": false,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(20, 20),
      "undoManager.isEnabled": true,
      initialAutoScale: go.Diagram.None,
      contentAlignment: go.Spot.None,
    });

    // Plantillas de nodos y enlaces
    // Plantilla de nodo ajustada
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
          defaultStretch: go.GraphObject.Fill,
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

          // Línea separadora ajustable
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

          // Panel para los atributos dinámicos
          new go.Panel("Vertical", {
            row: 2,
            column: 0,
            columnSpan: 2,
            alignment: go.Spot.Left,
            margin: new go.Margin(5, 5, 5, 5),
            defaultAlignment: go.Spot.Left,
            itemTemplate: new go.Panel("Horizontal").add(
              new go.TextBlock({
                font: "italic 11pt sans-serif",
                isMultiline: true,
                editable: true,
                margin: new go.Margin(0, 5, 0, 0),
              }).bindTwoWay("text", "name"),

              // Botón para eliminar atributo
              go.GraphObject.make(
                "Button", // Creando el botón
                go.GraphObject.make(go.TextBlock, "X"),
                {
                  click: function (e, obj) {
                    let node = obj.part; // El nodo al que pertenece el botón
                    let diagram = node.diagram;

                    if (!node || !diagram) return; // Verificar que el nodo y el diagrama existen

                    diagram.startTransaction("remove attribute");

                    const attributeId = obj.data.id; // Suponiendo que `obj.data` tiene el atributo actual

                    // Eliminar el atributo del nodo específico usando el id
                    const index = node.data.attributes.findIndex(
                      (attr) => attr.id === attributeId
                    );
                    if (index !== -1) {
                      diagram.model.removeArrayItem(
                        node.data.attributes,
                        index
                      );
                    }
                    diagram.commitTransaction("remove attribute");
                  },
                }
              )
            ),
          }).bindTwoWay("itemArray", "attributes"),

          // Botón para agregar un nuevo atributo
          new go.Panel("Horizontal", {
            row: 3,
            column: 0,
            columnSpan: 2,
            alignment: go.Spot.Left,
          }).add(
            go.GraphObject.make(
              "Button", // Creando el botón
              go.GraphObject.make(go.TextBlock, "+"),
              {
                click: function (e, obj) {
                  console.log(obj.part);
                  let node = obj.part; // Nodo seleccionado
                  let diagram = node.diagram;

                  // Iniciar la transacción para agregar un atributo
                  diagram.startTransaction("add attribute");

                  if (!node.data.attributes) {
                    // Si no tiene atributos, inicializarlos
                    diagram.model.setDataProperty(node.data, "attributes", []);
                  }

                  // Generar un nuevo identificador único para el atributo
                  const newId =
                    node.data.attributes.length > 0
                      ? Math.max(
                          ...node.data.attributes.map((attr) => attr.id)
                        ) + 1
                      : 1;

                  // Agregar un nuevo atributo al nodo específico con un id único
                  const newAttribute = { id: newId, name: "Nuevo Atributo" };
                  diagram.model.addArrayItem(
                    node.data.attributes,
                    newAttribute
                  );

                  // Confirmar la transacción
                  diagram.commitTransaction("add attribute");
                },
              }
            )
          )
        )
      );

    // Definir plantillas para distintos tipos de enlaces
    diagram.current.linkTemplateMap.add(
      "asociacion",
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

    //muchos a muchos
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
      }).add(
        new go.Shape({ strokeWidth: 2, stroke: "black" }) // Puedes cambiar el color del enlace aquí
      )
    );

    // Plantilla para generalización
    diagram.current.linkTemplateMap.add(
      "generalizacion",
      new go.Link({
        routing: go.Routing.Normal,
        corner: 5,
      }).add(
        new go.Shape({ strokeWidth: 2, stroke: "black" }), // Línea del enlace
        new go.Shape({
          toArrow: "Triangle", // Tipo de flecha
          fill: "white", // Relleno blanco
          stroke: "black", // Borde negro
          strokeWidth: 1, // Grosor del borde
          scale: 1.5, // Tamaño de la punta de la flecha
        })
      )
    );

    // Plantilla para agregación
    diagram.current.linkTemplateMap.add(
      "agregacion",
      new go.Link({
        routing: go.Routing.Normal,
        corner: 5,
      }).add(
        new go.Shape({ strokeWidth: 2, stroke: "black" }), // Línea del enlace
        new go.Shape({
          toArrow: "Diamond", // Tipo de flecha
          fill: "white", // Relleno blanco
          stroke: "black", // Borde negro
          strokeWidth: 1, // Grosor del borde
          scale: 1.5, // Tamaño de la punta de la flecha
        })
      )
    );

    diagram.current.linkTemplateMap.add(
      "composicion",
      new go.Link({
        routing: go.Routing.Normal,
        corner: 5,
      }).add(
        new go.Shape({ strokeWidth: 2, stroke: "black" }), // Línea del enlace
        new go.Shape({
          toArrow: "Diamond", // Tipo de flecha
          fill: "black", // Relleno blanco
          stroke: "black", // Borde negro
          strokeWidth: 1, // Grosor del borde
          scale: 1.5, // Tamaño de la punta de la flecha
        })
      )
    );

    // Paleta
    const palette = new go.Palette(paletteRef.current, {
      nodeTemplate: diagram.current.nodeTemplate,
      model: new go.GraphLinksModel([
        { key: 1, name: "Clase", attributes: [] },
      ]),
    });

    // Escuchar selección de enlaces
    diagram.current.addDiagramListener("LinkDrawn", (e) => {
      const link = e.subject; // El enlace recién creado
      const model = diagram.current.model;

      // Inicializar las multiplicidades si no están presentes
      model.setDataProperty(link.data, "fromMultiplicity", "1");
      model.setDataProperty(link.data, "toMultiplicity", "*");

      // Establecer el enlace como seleccionado
      setSelectedLink(link);
    });

    diagram.current.addDiagramListener("ObjectSingleClicked", (e) => {
      const part = e.subject.part;
      if (part instanceof go.Link) {
        setSelectedLink(part); // Establecer el enlace seleccionado

        // Obtener el tipo de enlace (su categoría) y actualizar el estado del selector
        const linkCategory = part.data.category || "asociacion";
        setSelectedLinkType(linkCategory);
      }
    });

    diagram.current.addModelChangedListener((e) => {
      if (e.isTransactionFinished && diagram.current) {
        const json = diagram.current.model.toJson();
        if (json !== lastDiagramJson.current) {
          lastDiagramJson.current = json;
          socket.emit("actualizar-diagrama", {
            room: roomCode,
            diagrama: json,
          });
        }
      }
    });

    diagram.current.addDiagramListener("ObjectSingleClicked", (e) => {
      const part = e.subject.part;
      if (part instanceof go.Node) {
        setSelectedNode(part.data); // Guardar el nodo seleccionado
      }
    });

    socket.on("diagrama-actualizado", (json_diagrama) => {
      if (diagram.current) {
        diagram.current.model = go.Model.fromJson(json_diagrama);
      }
    });

    return () => {
      diagram.current.div = null;
      palette.div = null;
      socket.off("diagrama-actualizado");
    };
  }, [roomCode]);

  const handleAddRecursiveLink = () => {
    if (selectedNode) {
      diagram.current.startTransaction("addRecursiveLink");

      // Añadir un enlace desde el nodo a sí mismo (recursivo)
      diagram.current.model.addLinkData({
        from: selectedNode.key,
        to: selectedNode.key,
        category: "recursivo", // O el tipo de relación que prefieras
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
    }
  };

  const generateUniqueKey = () => {
    return Math.floor(Date.now() + Math.random() * 10000);
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
    }
  };

  //   // Función para exportar el diagrama a JSON
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

  // Función para importar JSON y cargar el diagrama
  const importFromJson = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonData = e.target.result;
        diagram.current.model = go.Model.fromJson(jsonData);
      };
      reader.readAsText(file);
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
          <input type="file" accept=".json" onChange={importFromJson} />
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
          <button onClick={handleAddRecursiveLink}>
            Agregar Enlace Recursivo
          </button>
        </div>
      </div>
      <div ref={diagramRef} className="diagrama" id="diagrama"></div>
    </div>
  );
};

export default Room;
