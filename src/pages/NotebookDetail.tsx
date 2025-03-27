import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, getDoc, collection, getDocs, query, where, deleteDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { GoogleGenerativeAI} from '@google/generative-ai';
import ToolsMenu from '../components/ToolsMenu';
import EvaluationMenu from '../components/EvaluationMenu';
import '../styles/NotebookDetail.css';

// Add TypeScript declaration for window.env
declare global {
  interface Window {
    env?: {
      VITE_GEMINI_API_KEY?: string;
      [key: string]: any;
    };
  }
}

interface ConceptDoc {
  id: string;
  cuadernoId: string;
  usuarioId: string;
  conceptos: Concept[];
  creadoEn: Date;
}

interface Concept {
  término: string;
  definición: string;
  fuente: string;
}

// Function to convert Uint8Array to base64 string
function arrayBufferToBase64(buffer: Uint8Array | ArrayBuffer): string {
  // If buffer is ArrayBuffer, convert to Uint8Array
  const uint8Array = buffer instanceof ArrayBuffer 
    ? new Uint8Array(buffer) 
    : buffer;
  
  // Convert Uint8Array to a string of characters
  const binaryString = uint8Array.reduce(
    (data, byte) => data + String.fromCharCode(byte), 
    ''
  );
  
  // Convert binary string to base64
  return btoa(binaryString);
}

const NotebookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cuaderno, setCuaderno] = useState<any>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [conceptosDocs, setConceptosDocs] = useState<ConceptDoc[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("Cargando...");
  const [model, setModel] = useState<any>(null);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  const [nuevoConcepto, setNuevoConcepto] = useState<Concept>({
    término: '',
    definición: '',
    fuente: 'Manual'
  });
  
  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  
  // Referencia para el modal
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Initialize Gemini AI
  useEffect(() => {
    const initializeGemini = () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          console.error("Gemini API key is missing. Check your .env file.");
          setApiKeyError(true);
          return null;
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        // Importante: Usamos gemini-1.5-flash-latest para mejor soporte de archivos PDF
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        setModel(geminiModel);
        return geminiModel;
      } catch (error) {
        console.error("Error initializing Gemini AI:", error);
        setApiKeyError(true);
        return null;
      }
    };

    initializeGemini();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      // Check authentication
      if (!auth.currentUser) {
        console.error("User not authenticated");
        navigate('/login');
        return;
      }
      
      try {
        // Fetch notebook details
        const docRef = doc(db, 'notebooks', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCuaderno({ id: docSnap.id, ...data });
        } else {
          console.error("No such notebook!");
          navigate('/notebooks');
          return;
        }
        
        // Fetch concept documents for this notebook
        const q = query(
          collection(db, 'conceptos'),
          where('cuadernoId', '==', id)
        );
        
        const querySnapshot = await getDocs(q);
        const conceptosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ConceptDoc[];
        
        setConceptosDocs(conceptosData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  // Efecto para cerrar el modal al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    }
    
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  // Cerrar modal al presionar ESC
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    }
    
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(Array.from(e.target.files));
    }
  };

  // Definimos una interfaz personalizada para nuestros archivos procesados
  interface ProcessedFile {
    mimeType: string;
    data: Uint8Array;
  }

  const fileToProcessedFile = async (file: File): Promise<ProcessedFile> => {
    const bytes = await file.arrayBuffer();
    return {
      mimeType: file.type,
      data: new Uint8Array(bytes)
    };
  };

  const generarConceptos = async () => {
    if (!model || !id || !auth.currentUser) {
      alert("No se pudo inicializar la IA o la sesión de usuario");
      return;
    }

    if (archivos.length === 0) {
      alert("Por favor selecciona al menos un archivo PDF");
      return;
    }

    setCargando(true);
    setLoadingText("Preparando archivos para análisis...");

    try {
      // Convertir archivos a nuestro formato personalizado de procesamiento
      const filePromises = archivos.map(file => fileToProcessedFile(file));
      const fileContents = await Promise.all(filePromises);
      
      setLoadingText("Generando conceptos con IA...");

      // Crear el prompt para Gemini
      const prompt = `
        Por favor, analiza estos archivos y extrae una lista de conceptos clave con sus definiciones.
        Devuelve el resultado como un array JSON con el siguiente formato:
        [
          {
            "término": "nombre del concepto",
            "definición": "explicación concisa del concepto (20-30 palabras)",
            "fuente": "nombre del documento"
          }
        ]
        Extrae al menos 10 conceptos importantes si el documento es lo suficientemente extenso.
        Asegúrate de que el resultado sea únicamente el array JSON, sin texto adicional.
      `;

      // Crear un contenido con partes para enviar a Gemini
      const result = await model.generateContent({
        contents: [{
          parts: [
            { text: prompt },
            ...fileContents.map(file => ({
              inlineData: {
                mimeType: file.mimeType,
                // Convertir el Uint8Array a base64 string como requiere la API de Gemini
                data: arrayBufferToBase64(file.data)
              }
            }))
          ]
        }],
      });

      const respuesta = result.response.text();
      
      // Parse the JSON response
      let conceptosExtraidos: Concept[] = [];
      try {
        // Find JSON in the response
        const jsonMatch = respuesta.match(/\[.*\]/s);
        if (jsonMatch) {
          conceptosExtraidos = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON array found in response");
        }
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        console.log('Raw response:', respuesta);
        alert('Error al interpretar la respuesta de la IA. Por favor intenta de nuevo.');
        setCargando(false);
        return;
      }

      if (!conceptosExtraidos.length) {
        alert('No se pudieron extraer conceptos del documento. Intenta con otro PDF.');
        setCargando(false);
        return;
      }

      setLoadingText("Guardando conceptos...");

      let updatedConceptosDoc: ConceptDoc | null = null;
      if (conceptosDocs.length > 0) {
        // Si existe al menos un documento para este cuaderno, actualizamos el primero
        const existingDoc = conceptosDocs.find(doc => doc.cuadernoId === id);
        if (existingDoc) {
          const conceptosRef = doc(db, 'conceptos', existingDoc.id);
          await updateDoc(conceptosRef, {
            conceptos: arrayUnion(...conceptosExtraidos)
          });
          // Actualizamos el estado local agregando los nuevos conceptos al array existente
          updatedConceptosDoc = {
            ...existingDoc,
            conceptos: [...existingDoc.conceptos, ...conceptosExtraidos]
          };
          setConceptosDocs(prev =>
            prev.map(doc => (doc.id === existingDoc.id ? updatedConceptosDoc! : doc))
          );
        }
      }

      if (!updatedConceptosDoc) {
        // Si no existe ningún documento, creamos uno nuevo
        // Agregamos al estado local. Como usamos el id del cuaderno para el documento nuevo:
        setConceptosDocs(prev => [
          ...prev,
          {
            id: id,
            cuadernoId: id,
            usuarioId: auth.currentUser?.uid || '',
            conceptos: conceptosExtraidos,
            creadoEn: new Date()
          }
        ]);
      }

      // Clear file input
      setArchivos([]);
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Cerrar el modal después de generación exitosa
      setIsModalOpen(false);
      
      alert(`¡Se generaron ${conceptosExtraidos.length} conceptos exitosamente!`);
    } catch (error) {
      console.error('Error al generar conceptos:', error);
      alert('Error al procesar los materiales. Archivos aceptados: pdf, csv, txt');
    }
    
    setCargando(false);
  };

  // Función para eliminar el cuaderno y todos sus conceptos relacionados
  const eliminarCuaderno = async () => {
    if (!id || !auth.currentUser) return;
    
    try {
      setCargando(true);
      setLoadingText("Eliminando cuaderno...");
      
      // 1. Primero, obtener y eliminar todos los documentos de conceptos asociados
      const conceptosQuery = query(
        collection(db, 'conceptos'),
        where('cuadernoId', '==', id)
      );
      
      const conceptosSnapshot = await getDocs(conceptosQuery);
      
      // Eliminar cada documento de conceptos
      const deletePromises = conceptosSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      // Esperar a que se eliminen todos los documentos de conceptos
      await Promise.all(deletePromises);
      
      // 2. Eliminar el documento del cuaderno
      await deleteDoc(doc(db, 'notebooks', id));
      
      // 3. Redirigir al usuario a la página de cuadernos
      navigate('/notebooks', { replace: true });
      
    } catch (error) {
      console.error("Error al eliminar cuaderno:", error);
      alert("Ha ocurrido un error al eliminar el cuaderno. Por favor intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  // Función para añadir concepto manualmente
  const agregarConceptoManual = async () => {
    if (!id || !auth.currentUser) {
      alert("No se pudo verificar la sesión de usuario");
      return;
    }

    if (!nuevoConcepto.término || !nuevoConcepto.definición) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    setCargando(true);
    setLoadingText("Guardando concepto...");

    try {
      const conceptoManual: Concept = {
        término: nuevoConcepto.término,
        definición: nuevoConcepto.definición,
        fuente: nuevoConcepto.fuente || 'Manual'
      };

      let updatedConceptosDoc: ConceptDoc | null = null;
      if (conceptosDocs.length > 0) {
        const existingDoc = conceptosDocs.find(doc => doc.cuadernoId === id);
        if (existingDoc) {
          const conceptosRef = doc(db, 'conceptos', existingDoc.id);
          await updateDoc(conceptosRef, {
            conceptos: arrayUnion(conceptoManual)
          });
          updatedConceptosDoc = {
            ...existingDoc,
            conceptos: [...existingDoc.conceptos, conceptoManual]
          };
          setConceptosDocs(prev =>
            prev.map(doc => (doc.id === existingDoc.id ? updatedConceptosDoc! : doc))
          );
        }
      }

      if (!updatedConceptosDoc) {
        // Si no existe un documento, crear uno nuevo usando el id del cuaderno
        await setDoc(doc(db, 'conceptos', id), {
          cuadernoId: id,
          usuarioId: auth.currentUser.uid,
          conceptos: [conceptoManual],
          creadoEn: new Date()
        });
        setConceptosDocs(prev => [
          ...prev,
          {
            id: id,
            cuadernoId: id,
            usuarioId: auth.currentUser?.uid || '',
            conceptos: [conceptoManual],
            creadoEn: new Date()
          }
        ]);
      }

      // Limpiar el formulario
      setNuevoConcepto({
        término: '',
        definición: '',
        fuente: 'Manual'
      });
      
      // Cerrar el modal después de creación exitosa
      setIsModalOpen(false);
      
      alert("Concepto añadido exitosamente");
    } catch (error) {
      console.error('Error al guardar concepto manual:', error);
      alert('Error al guardar el concepto. Por favor intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  // Abrir modal con pestaña específica
  const openModalWithTab = (tab: 'upload' | 'manual') => {
    setActiveTab(tab);
    setIsModalOpen(true);
  };

  // Componentes del modal
  const renderModalContent = () => {
    return (
      <div className="modal-content" ref={modalRef}>
        <div className="modal-header">
          <h2>Añadir nuevos conceptos</h2>
          <button className="close-modal-button" onClick={() => setIsModalOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <i className="fas fa-file-upload"></i> Subir materiales
          </button>
          <button 
            className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <i className="fas fa-pencil-alt"></i> Añadir manualmente
          </button>
        </div>
        
        <div className="modal-body">
          {activeTab === 'upload' ? (
            <div className="upload-container">
              {apiKeyError && (
                <div className="error-message">
                  <p>⚠️ No se pudo inicializar la IA. Verifica la clave API de Gemini en tu archivo .env.</p>
                </div>
              )}
              
              <input
                type="file"
                id="pdf-upload"
                multiple
                accept="*/*"
                onChange={handleFileChange}
                disabled={cargando}
                className="file-input"
              />
              <div className="selected-files">
                {archivos.length > 0 && (
                  <>
                    <p><strong>Archivos seleccionados:</strong></p>
                    <ul>
                      {archivos.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <button 
                onClick={generarConceptos} 
                disabled={archivos.length === 0 || cargando || apiKeyError}
                className="generate-button"
              >
                {cargando ? loadingText : 'Generar Conceptos'}
              </button>
            </div>
          ) : (
            <div className="concept-form">
              <div className="form-group">
                <label htmlFor="termino">Término *</label>
                <input 
                  type="text" 
                  id="termino"
                  value={nuevoConcepto.término}
                  onChange={(e) => setNuevoConcepto({...nuevoConcepto, término: e.target.value})}
                  placeholder="Nombre del concepto"
                  disabled={cargando}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="definicion">Definición *</label>
                <textarea 
                  id="definicion"
                  value={nuevoConcepto.definición}
                  onChange={(e) => setNuevoConcepto({...nuevoConcepto, definición: e.target.value})}
                  placeholder="Explica brevemente el concepto"
                  rows={4}
                  disabled={cargando}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fuente">Fuente</label>
                <input 
                  type="text" 
                  id="fuente"
                  value={nuevoConcepto.fuente}
                  onChange={(e) => setNuevoConcepto({...nuevoConcepto, fuente: e.target.value})}
                  placeholder="Fuente del concepto"
                  disabled={cargando}
                />
              </div>
              
              <button 
                onClick={agregarConceptoManual} 
                disabled={cargando || !nuevoConcepto.término || !nuevoConcepto.definición}
                className="add-concept-button"
              >
                {cargando && loadingText === "Guardando concepto..." ? loadingText : 'Añadir Concepto'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Muestra spinner de carga mientras se obtienen los datos
  if (!cuaderno) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando cuaderno...</p>
      </div>
    );
  }

  return (
    <div className="notebook-detail-container">
      <header className="notebook-detail-header">
        <div className="header-content">
          <div className="breadcrumb">
            <button onClick={() => navigate('/notebooks')} className="back-button">
              <i className="fas fa-arrow-left"></i> Volver
            </button>
            <h1>{cuaderno.title}</h1>
          </div>
        </div>
      </header>

      <main className="notebook-detail-main">
        <div className="sidebar-container">
          {/* Barra lateral con menús */}
          <ToolsMenu notebookId={id} />
          <EvaluationMenu notebookId={id} />
        </div>

        <section className="concepts-section">
          <h2>Conceptos del Cuaderno</h2>
          
          <div className="concepts-list">
            {conceptosDocs.length === 0 ? (
              <div className="empty-state">
                <p>Aún no hay conceptos en este cuaderno.</p>
                <button 
                  className="add-first-concept-button"
                  onClick={() => openModalWithTab('upload')}
                >
                  <i className="fas fa-plus"></i> Añadir mi primer concepto
                </button>
              </div>
            ) : (
              <>
                <div className="concept-cards">
                  {conceptosDocs.flatMap((doc) => 
                    doc.conceptos.map((concepto, conceptIndex) => (
                      <div 
                        key={`${doc.id}-${conceptIndex}`}
                        className="concept-card"
                        onClick={() => navigate(`/notebooks/${id}/concepto/${doc.id}/${conceptIndex}`)}
                      >
                        <h4>{concepto.término}</h4>
                      </div>
                    ))
                  )}
                  
                  {/* Tarjeta para añadir nuevos conceptos */}
                  <div 
                    className="add-concept-card" 
                    onClick={() => openModalWithTab('upload')}
                  >
                    <div className="add-icon">
                      <i className="fas fa-plus-circle"></i>
                    </div>
                    <h4>Añadir nuevos conceptos</h4>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          {renderModalContent()}
        </div>
      )}
      
      {/* Botón flotante para añadir conceptos (visible en móvil) */}
      <button 
        className="floating-add-button"
        onClick={() => openModalWithTab('upload')}
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default NotebookDetail;