import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, getDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { GoogleGenerativeAI} from '@google/generative-ai';
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

      // Save concepts to Firebase
      const conceptoDocRef = await addDoc(collection(db, 'conceptos'), {
        cuadernoId: id,
        usuarioId: auth.currentUser.uid,
        conceptos: conceptosExtraidos,
        creadoEn: new Date()
      });

      // Update local state
      setConceptosDocs([...conceptosDocs, {
        id: conceptoDocRef.id,
        cuadernoId: id,
        usuarioId: auth.currentUser.uid,
        conceptos: conceptosExtraidos,
        creadoEn: new Date()
      }]);

      // Clear file input
      setArchivos([]);
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      alert(`¡Se generaron ${conceptosExtraidos.length} conceptos exitosamente!`);
    } catch (error) {
      console.error('Error al generar conceptos:', error);
      alert('Error al procesar los materiales. Archivos aceptados: pdf, csv, txt');
    }
    
    setCargando(false);
  };

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
        <section className="pdf-upload-section">
          <h2>Subir material para generar conceptos</h2>
          
          {apiKeyError && (
            <div className="error-message" style={{ color: 'red', padding: '10px', background: '#ffeeee', marginBottom: '15px', borderRadius: '5px' }}>
              <p>⚠️ No se pudo inicializar la IA. Verifica la clave API de Gemini en tu archivo .env.</p>
            </div>
          )}
          
          <div className="upload-container">
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
        </section>

        <section className="concepts-section">
          <h2>Conceptos del Cuaderno</h2>
          {conceptosDocs.length === 0 ? (
            <div className="empty-state">
              <p>Aún no hay conceptos en este cuaderno. Sube un PDF para comenzar.</p>
            </div>
          ) : (
            <div className="concepts-list">
              {conceptosDocs.map(doc => (
                <div key={doc.id} className="concept-group">
                  <h3>Grupo de conceptos</h3>
                  <div className="concept-cards">
                    {doc.conceptos.map((concepto, index) => (
                      <div 
                        key={index}
                        className="concept-card"
                        onClick={() => navigate(`/notebooks/${id}/concepto/${doc.id}/${index}`)}
                      >
                        <h4>{concepto.término}</h4>
                        <p>{concepto.definición.substring(0, 70)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default NotebookDetail;