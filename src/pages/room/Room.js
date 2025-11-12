import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import * as go from "gojs";
import socket from "../../services/socket";
import "./Room.css";
import {
  downloadZip,
  downloadFlutterProject,
  updateDiagram,
} from "../../services/sala";
import { askQuestion, uploadImage, fixMultiplicity, validateDiagram } from "../../services/ia";
import Swal from "sweetalert2";
import Loading from "../../components/Loading";
import {
  FaDownload,
  FaUpload,
  FaSave,
  FaLeaf,
  FaMobile,
  FaCheckCircle,
  FaCode,
  FaHome,
  FaKey,
  FaUser,
  FaCopy
} from "react-icons/fa";

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
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  // Estados para el panel flotante de IA
  const [showIAPanel, setShowIAPanel] = useState(false);
  const [iaQuestion, setIaQuestion] = useState("");
  const [iaResponse, setIaResponse] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Procesando...");
  const [autoGuardado, setAutoGuardado] = useState(false);
  const recognitionRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const scheduleAutoSaveRef = useRef(null);

  // Usar useMemo para estabilizar las referencias de localStorage
  const user = useMemo(() => {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  }, []);

  const sala = useMemo(() => {
    const salaData = localStorage.getItem("sala");
    return salaData ? JSON.parse(salaData) : null;
  }, []);

  // Verificar si el usuario actual es admin de la sala
  const isAdmin = useMemo(() => {
    if (!user || !sala) return false;
    return user.id === sala.adminId;
  }, [user, sala]);
  
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
          }).bindTwoWay("text", "attribute"),

          new go.Shape("LineH", {
            row: 3,
            column: 0,
            columnSpan: 2,
            stroke: "black",
            strokeWidth: 1,
            height: 1,
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(5, 0, 5, 0),
          }),

          new go.TextBlock({
            row: 4,
            column: 0,
            columnSpan: 2,
            font: "italic 11pt sans-serif",
            isMultiline: true,
            editable: true,
            wrap: go.TextBlock.WrapFit,
            margin: new go.Margin(5, 5, 5, 5),
          }).bindTwoWay("text", "methods")
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
          editable: false,
        }).bindTwoWay("text", "fromMultiplicity"),
        new go.TextBlock({
          text: "1",
          textAlign: "center",
          font: "bold 16px sans-serif",
          stroke: "black",
          segmentIndex: -1,
          segmentOffset: new go.Point(-20, NaN),
          segmentOrientation: go.Orientation.Upright,
          editable: false,
        }).bindTwoWay("text", "toMultiplicity")
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
          methods: "metodo1(): tipo\nmetodo2(): tipo",
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
      model.setDataProperty(link.data, "fromMultiplicity", "*");
      model.setDataProperty(link.data, "toMultiplicity", "1");
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
      console.log("Reconectando a sala:", sala.id);
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

      // Trigger autoguardado si está habilitado y no es una actualización por socket
      if (!isSocketUpdate && scheduleAutoSaveRef.current) {
        scheduleAutoSaveRef.current();
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
          
          // Trigger autoguardado
          if (scheduleAutoSaveRef.current) {
            scheduleAutoSaveRef.current();
          }
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
        
        // Trigger autoguardado
        if (scheduleAutoSaveRef.current) {
          scheduleAutoSaveRef.current();
        }
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
        
        // Trigger autoguardado
        if (scheduleAutoSaveRef.current) {
          scheduleAutoSaveRef.current();
        }
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
        
        // Trigger autoguardado
        if (scheduleAutoSaveRef.current) {
          scheduleAutoSaveRef.current();
        }
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
      console.log("nodo enviado");
      isSocketUpdate = false;
    });

    socket.on("recargar-todo-cliente", (payload) => {
      isSocketUpdate = true;
      if (diagram.current) {
        diagram.current.model = go.Model.fromJson(payload);
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
      
      // Limpiar timeout de autoguardado
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
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
    return -Math.floor(Math.random() * 90000 + 1000);
  };

  const handleGuardarDiagrama = async () => {
    // Verificar que el usuario sea admin
    if (!isAdmin) {
      await Swal.fire({
        icon: "warning",
        title: "Acceso Denegado",
        text: "Solo el admin de la sala puede guardar el diagrama",
        confirmButtonColor: "#7b2ff7",
        background: "#1a1a2e",
        color: "#fff",
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "Sin autenticación",
          text: "Por favor, inicia sesión nuevamente",
          confirmButtonColor: "#7b2ff7",
          background: "#1a1a2e",
          color: "#fff",
        });
        return;
      }

      // Obtener el JSON plano del modelo GoJS
      const gojsJsonString = diagram.current.model.toJson();
      const gojsObject = JSON.parse(gojsJsonString);

      // Obtener el roomCode de los params
      const currentRoomId = roomCode; // roomCode viene de useParams

      console.log("Guardando diagrama en la base de datos...");
      console.log(selectedNode);
      const response = await updateDiagram(token, currentRoomId, gojsObject);

      await Swal.fire({
        icon: "success",
        title: "¡Guardado!",
        text: "Diagrama guardado correctamente en la base de datos",
        confirmButtonColor: "#00d4ff",
        background: "#1a1a2e",
        color: "#fff",
        timer: 2000,
        showConfirmButton: true,
      });

      console.log("Diagrama guardado exitosamente:", response);
    } catch (error) {
      console.error("Error al guardar el diagrama:", error);
      
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error al guardar el diagrama: ${error.message}`,
        confirmButtonColor: "#f72585",
        background: "#1a1a2e",
        color: "#fff",
      });
    }
  };

  const handleGenerateSpringBootProject = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "Sin autenticación",
          text: "Por favor, inicia sesión nuevamente",
          confirmButtonColor: "#7b2ff7",
          background: "#1a1a2e",
          color: "#fff",
        });
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Generando proyecto Spring Boot...");

      // Obtener el JSON plano del modelo GoJS
      const gojsJsonString = diagram.current.model.toJson();
      const gojsObject = JSON.parse(gojsJsonString);

      // Llamar al servicio de IA para corregir multiplicidades
      console.log("Enviando diagrama a fixMultiplicity IA...");
      const fixResponse = await fixMultiplicity(token, gojsObject);
      await downloadZip(token, JSON.parse(fixResponse.correctedDiagram));

      setIsLoading(false);

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Proyecto Spring Boot generado correctamente",
        confirmButtonColor: "#00d4ff",
        background: "#1a1a2e",
        color: "#fff",
        timer: 3000,
        showConfirmButton: true,
      });

      console.log("Descarga del ZIP iniciada correctamente");
    } catch (error) {
      setIsLoading(false);
      console.error("Error al descargar el diagrama:", error);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error al descargar el archivo: ${error.message}`,
        confirmButtonColor: "#f72585",
        background: "#1a1a2e",
        color: "#fff",
      });
    }
  };

  // Add a new function to handle Flutter project generation
  const handleGenerarFlutter = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "Sin autenticación",
          text: "Por favor, inicia sesión nuevamente",
          confirmButtonColor: "#7b2ff7",
          background: "#1a1a2e",
          color: "#fff",
        });
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Generando proyecto Flutter...");

      // Obtener el JSON plano del modelo GoJS
      const gojsJsonString = diagram.current.model.toJson();
      const gojsObject = JSON.parse(gojsJsonString);

      // Llamar al servicio de IA para corregir multiplicidades
      console.log("Enviando diagrama a fixMultiplicity IA...");
      const fixResponse = await fixMultiplicity(token, gojsObject);
      console.log(fixResponse);
      // // El backend devuelve un objeto que contiene correctedDiagram (según implementación del backend)
      // const corrected = fixResponse && fixResponse.correctedDiagram ? fixResponse.correctedDiagram : fixResponse;

      // // Asegurarse de que le pasamos un objeto con nodeDataArray/linkDataArray a downloadFlutterProject
      // const modelToSend = corrected && corrected.nodeDataArray ? corrected : gojsObject;

      await downloadFlutterProject(
        token,
        JSON.parse(fixResponse.correctedDiagram)
      );

      setIsLoading(false);

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Proyecto Flutter generado correctamente",
        confirmButtonColor: "#00d4ff",
        background: "#1a1a2e",
        color: "#fff",
        timer: 3000,
        showConfirmButton: true,
      });

      console.log("Generación del proyecto Flutter iniciada correctamente");
    } catch (error) {
      setIsLoading(false);
      console.error("Error al generar el proyecto Flutter:", error);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error al generar el proyecto Flutter: ${error.message}`,
        confirmButtonColor: "#f72585",
        background: "#1a1a2e",
        color: "#fff",
      });
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
        fromMultiplicity: "*",
        toMultiplicity: "1",
        category: "muchos-a-muchos", // Usa la categoría que prefieras
      });

      diagram.current.model.addLinkData({
        from: to,
        to: newNode.key,
        fromMultiplicity: "*",
        toMultiplicity: "1",
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

  // Función para cargar el diagrama desde un JSON
  const handleLoadFromJson = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);

      if (diagram.current) {
        diagram.current.model = go.Model.fromJson(parsedJson);

        // Emitir el diagrama actualizado a todos los conectados
        const json = diagram.current.model.toJson();
        socket.emit("recargar-todo", { room: roomCode, diagrama: json });

        alert("Diagrama cargado exitosamente");
        setShowJsonModal(false);
        setJsonInput("");
      }
    } catch (error) {
      console.error("Error al cargar el JSON:", error);
      alert(`Error al cargar el JSON: ${error.message}`);
    }
  };

  // Funciones para el panel de IA
  const handleAskQuestion = async () => {
    const json = diagram.current.model.toJson();
    const jsonString = JSON.stringify(json);
    if (!iaQuestion.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Escribe una pregunta antes de enviar",
        confirmButtonColor: "#7b2ff7",
        background: "#1a1a2e",
        color: "#fff",
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "Sin autenticación",
          text: "Por favor, inicia sesión nuevamente",
          confirmButtonColor: "#7b2ff7",
          background: "#1a1a2e",
          color: "#fff",
        });
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Procesando tu pregunta con IA...");

      console.log("Enviando pregunta:", iaQuestion);
      const response = await askQuestion(token, iaQuestion, jsonString);

      const parsedJson = JSON.parse(response);

      if (diagram.current) {
        diagram.current.model = go.Model.fromJson(parsedJson);

        // Emitir el diagrama actualizado a todos los conectados
        const json2 = diagram.current.model.toJson();
        socket.emit("recargar-todo", { room: roomCode, diagrama: json2 });
      }

      // Por ahora solo logueamos la respuesta
      console.log("Respuesta de IA:", response);

      setIaResponse(JSON.stringify(response, null, 2));
      setIaQuestion("");
      setIsLoading(false);

      await Swal.fire({
        icon: "success",
        title: "¡Listo!",
        text: "Tu pregunta fue procesada correctamente",
        confirmButtonColor: "#00d4ff",
        background: "#1a1a2e",
        color: "#fff",
        timer: 2500,
        showConfirmButton: true,
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Error al enviar pregunta:", error);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error al enviar pregunta: ${error.message}`,
        confirmButtonColor: "#f72585",
        background: "#1a1a2e",
        color: "#fff",
      });
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      await Swal.fire({
        icon: "warning",
        title: "Atención",
        text: "Selecciona una imagen antes de enviar",
        confirmButtonColor: "#7b2ff7",
        background: "#1a1a2e",
        color: "#fff",
      });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "Sin autenticación",
          text: "Por favor, inicia sesión nuevamente",
          confirmButtonColor: "#7b2ff7",
          background: "#1a1a2e",
          color: "#fff",
        });
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Analizando imagen con IA...");

      console.log("Enviando imagen:", {
        nombre: selectedImageFile.name,
        tipo: selectedImageFile.type,
        tamaño: selectedImageFile.size,
      });

      const response = await uploadImage(token, selectedImageFile);

      const parsedJson = JSON.parse(response.imageAnalysis);

      if (diagram.current) {
        diagram.current.model = go.Model.fromJson(parsedJson);

        // Emitir el diagrama actualizado a todos los conectados
        const json2 = diagram.current.model.toJson();
        socket.emit("recargar-todo", { room: roomCode, diagrama: json2 });
      }

      // Por ahora solo logueamos la respuesta
      console.log("Respuesta de imagen IA:", response.imageAnalysis);
      setSelectedImageFile(null);
      setImagePreview(null);
      setIsLoading(false);

      await Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "Imagen analizada y diagrama actualizado correctamente",
        confirmButtonColor: "#00d4ff",
        background: "#1a1a2e",
        color: "#fff",
        timer: 3000,
        showConfirmButton: true,
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Error al enviar imagen:", error);

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error al enviar imagen: ${error.message}`,
        confirmButtonColor: "#f72585",
        background: "#1a1a2e",
        color: "#fff",
      });
    }
  };

  const autoGuardarDiagrama = useCallback(async () => {
    // Solo admin puede usar autoguardado
    if (!autoGuardado || !isAdmin) return;
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const gojsJsonString = diagram.current.model.toJson();
      const gojsObject = JSON.parse(gojsJsonString);
      const currentRoomId = roomCode;

      console.log("Autoguardado silencioso (Admin)...");
      await updateDiagram(token, currentRoomId, gojsObject);
      console.log("Autoguardado completado por admin");
    } catch (error) {
      console.error("Error en autoguardado:", error);
    }
  }, [autoGuardado, isAdmin, roomCode]);

  const scheduleAutoSave = useCallback(() => {
    // Solo admin puede programar autoguardado
    if (!autoGuardado || !isAdmin) return;
    
    // Limpiar timeout anterior si existe
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Programar autoguardado en 2 segundos después del último cambio
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoGuardarDiagrama();
    }, 2000);
  }, [autoGuardado, isAdmin, autoGuardarDiagrama]);

  // Mantener referencia actualizada para el listener
  scheduleAutoSaveRef.current = scheduleAutoSave;

  const handleValidateDiagram = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "Sin autenticación",
          text: "Por favor, inicia sesión nuevamente",
          confirmButtonColor: "#7b2ff7",
          background: "#1a1a2e",
          color: "#fff",
        });
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Verificando diagrama...");

      // Obtener el JSON plano del modelo GoJS
      const gojsJsonString = diagram.current.model.toJson();
      const gojsObject = JSON.parse(gojsJsonString);

      console.log("Enviando diagrama para validación...");
      const response = await validateDiagram(token, gojsObject);

      setIsLoading(false);

      if (response.perfect === "yes") {
        // Diagrama perfecto
        await Swal.fire({
          icon: "success",
          title: "¡Diagrama Perfecto!",
          text: "Tu diagrama está correctamente validado y no necesita correcciones",
          confirmButtonColor: "#00d4ff",
          background: "#1a1a2e",
          color: "#fff",
          timer: 4000,
          showConfirmButton: true,
        });
      } else {
        // Diagrama necesita correcciones
        const result = await Swal.fire({
          icon: "warning",
          title: "Diagrama con Errores",
          text: "Se encontraron errores en tu diagrama. ¿Quieres aplicar las correcciones automáticas?",
          showCancelButton: true,
          confirmButtonText: "Sí, corregir",
          cancelButtonText: "No, mantener actual",
          confirmButtonColor: "#00d4ff",
          cancelButtonColor: "#6c757d",
          background: "#1a1a2e",
          color: "#fff",
        });

        if (result.isConfirmed) {
          // Usuario quiere aplicar las correcciones
          try {
            const correctedDiagram = JSON.parse(response.diagram);
            
            if (diagram.current) {
              diagram.current.model = go.Model.fromJson(correctedDiagram);

              // Emitir el diagrama corregido a todos los conectados
              const correctedJson = diagram.current.model.toJson();
              socket.emit("recargar-todo", { room: roomCode, diagrama: correctedJson });

              await Swal.fire({
                icon: "success",
                title: "¡Diagrama Corregido!",
                text: "Las correcciones se han aplicado exitosamente",
                confirmButtonColor: "#00d4ff",
                background: "#1a1a2e",
                color: "#fff",
                timer: 3000,
                showConfirmButton: true,
              });
            }
          } catch (parseError) {
            console.error("Error al parsear diagrama corregido:", parseError);
            await Swal.fire({
              icon: "error",
              title: "Error",
              text: "No se pudieron aplicar las correcciones automáticas",
              confirmButtonColor: "#f72585",
              background: "#1a1a2e",
              color: "#fff",
            });
          }
        }
        // Si result.isConfirmed es false, no hacemos nada (se cierra el modal)
      }

      console.log("Validación completada:", response);
    } catch (error) {
      setIsLoading(false);
      console.error("Error al validar diagrama:", error);
      
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error al validar el diagrama: ${error.message}`,
        confirmButtonColor: "#f72585",
        background: "#1a1a2e",
        color: "#fff",
      });
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "es-ES";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIaQuestion((prev) => (prev ? prev + " " + transcript : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error al iniciar reconocimiento:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCopyRoomCode = async () => {
    try {
      // eslint-disable-next-line
      const codeRoom = sala?.id || codeRoom;
      await navigator.clipboard.writeText(codeRoom);
      
      Swal.fire({
        icon: "success",
        title: "¡Código copiado!",
        text: `El código "${codeRoom}" ha sido copiado al portapapeles`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        confirmButtonColor: "#00d4ff",
      });
    } catch (error) {
      console.error('Error al copiar el código:', error);
      
      Swal.fire({
        icon: "error",
        title: "Error al copiar",
        text: "No se pudo copiar el código al portapapeles",
        confirmButtonColor: "#f72585",
      });
    }
  };

  return (
    <div className="room">
      {isLoading && <Loading message={loadingMessage} />}
      
      {/* Header con información de la sala */}
      {sala && (
        <div className="room-header">
          <div className="header-content">
            <div className="header-left">
              <FaHome className="header-icon" />
              <h2 className="room-name">{sala.name || 'Sala sin nombre'}</h2>
            </div>
            <div className="header-right">
              <div className="room-code">
                <FaKey className="meta-icon" />
                <span>Código: {sala.id || roomCode}</span>
                <button 
                  className="copy-btn" 
                  onClick={handleCopyRoomCode}
                  title="Copiar código"
                >
                  <FaCopy />
                </button>
              </div>
              {sala.admin && (
                <div className="room-admin">
                  <FaUser className="meta-icon" />
                  <span>Admin: {sala.admin.name || 'Sin nombre'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="room-body">
        <div className="panel-izq">
          <div ref={paletteRef} className="paleta" id="paleta"></div>
          
          <div className="area-trabajo">
          <button className="btn-json" id="export-json" onClick={exportToJson}>
            <FaDownload className="btn-icon" />
            Exportar JSON
          </button>
          <button className="btn-json" onClick={() => setShowJsonModal(true)}>
            <FaUpload className="btn-icon" />
            Cargar JSON
          </button>
          <div className="link">
            <label>Tipo de relación:</label>
            <select value={selectedLinkType} onChange={handleRelationChange}>
              <option value="generalizacion">Generalización</option>
              <option value="composicion">Composición</option>
              <option value="agregacion">Agregación</option>
              <option value="asociacion">Asociación</option>
              <option value="muchos-a-muchos">Muchos a muchos</option>
            </select>
          </div>
          <button className="atri" onClick={handleGuardarDiagrama}>
            <FaSave className="btn-icon" />
            {isAdmin ? "Guardar diagrama" : "Guardar diagrama (Solo admin)"}
          </button>
          <button className="rec-link" onClick={() => handleGenerateSpringBootProject()}>
            <FaLeaf className="btn-icon" />
            Generar Spring Boot
          </button>
          <button className="rec-link" onClick={handleGenerarFlutter}>
            <FaMobile className="btn-icon" />
            Generar Flutter
          </button>
          <button className="rec-link" onClick={handleValidateDiagram}>
            <FaCheckCircle className="btn-icon" />
            Verificar diagrama
          </button>
          
          {/* Switch de autoguardado - Solo para admin */}
          {isAdmin && (
            <div className="auto-save-container">
              <label className="auto-save-label">
                <input
                  type="checkbox"
                  checked={autoGuardado}
                  onChange={(e) => setAutoGuardado(e.target.checked)}
                  className="auto-save-checkbox"
                />
                <span className="auto-save-text">Autoguardado (Admin)</span>
              </label>
            </div>
          )}
        </div>
      </div>
      <div ref={diagramRef} className="diagrama" id="diagrama"></div>
      </div>

      {/* Modal para cargar JSON */}
      {showJsonModal && (
        <div className="modal-overlay" onClick={() => setShowJsonModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Cargar Diagrama desde JSON</h2>
            <textarea
              className="json-textarea"
              placeholder="Pega tu JSON aquí..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={15}
            />
            <div className="modal-buttons">
              <button className="btn-cargar" onClick={handleLoadFromJson}>
                <FaUpload className="btn-icon" />
                Cargar
              </button>
              <button
                className="btn-cancelar"
                onClick={() => {
                  setShowJsonModal(false);
                  setJsonInput("");
                }}
              >
                <FaCode className="btn-icon" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante para IA */}
      <button
        className="floating-ai-btn"
        onClick={() => setShowIAPanel(!showIAPanel)}
        aria-label="Abrir panel de IA"
      >
        AI
      </button>

      {/* Panel lateral de IA */}
      {showIAPanel && (
        <div className="ia-panel-overlay" onClick={() => setShowIAPanel(false)}>
          <div className="ia-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ia-panel-header">
              <h3>Asistente IA</h3>
              <button
                className="close-btn"
                onClick={() => setShowIAPanel(false)}
              >
                ×
              </button>
            </div>

            <div className="ia-panel-body">
              {/* Sección de texto/voz */}
              <div className="ia-section">
                <label>Pregunta (Texto/Voz):</label>
                <textarea
                  value={iaQuestion}
                  onChange={(e) => setIaQuestion(e.target.value)}
                  placeholder="Escribe tu pregunta aquí..."
                  rows={4}
                  className="ia-textarea"
                />
                <div className="ia-buttons">
                  <button
                    onClick={handleAskQuestion}
                    className="ia-btn primary"
                  >
                    Enviar Pregunta
                  </button>
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`ia-btn ${
                      isListening ? "listening" : "secondary"
                    }`}
                  >
                    {isListening ? "Detener" : "Hablar"}
                  </button>
                </div>
              </div>

              {/* Sección de imagen */}
              <div className="ia-section">
                <label>Subir Imagen:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="ia-file-input"
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
                <button
                  onClick={handleUploadImage}
                  className="ia-btn primary"
                  disabled={!selectedImageFile}
                >
                  Enviar Imagen
                </button>
              </div>

              {/* Sección de respuesta */}
              {iaResponse && (
                <div className="ia-section">
                  <label>Respuesta:</label>
                  <pre className="ia-response">{iaResponse}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
