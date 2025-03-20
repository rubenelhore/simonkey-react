import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { doc, getDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import '../styles/NotebookDetail.css';

// Para el parseo de PDFs
import * as pdfjs from 'pdfjs-dist';

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

const NotebookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cuaderno, setCuaderno] = useState<any>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [conceptosDocs, setConceptosDocs] = useState<ConceptDoc[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("Cargando...");

  // Initialize Gemini AI
  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  let genAI: any = null;
  let model: any = null;

  if (GEMINI_API_KEY) {
    try {
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } catch (error) {
      console.error("Error initializing Gemini AI:", error);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        // Fetch notebook details
        const docRef = doc(db, 'notebooks', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setCuaderno({ id: docSnap.id, ...docSnap.data() });
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

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + ' ';
      }
      
      return fullText;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      return '';
    }
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
    setLoadingText("Extrayendo texto de PDFs...");

    try {
      // Extract text from PDFs
      const textosPDF = await Promise.all(
        archivos.map(async (file) => {
          return await extractTextFromPDF(file);
        })
      );

      setLoadingText("Generando conceptos con IA...");

      const prompt = `
        Analiza el siguiente texto y devuelve una lista de conceptos clave con sus definiciones y fuentes en formato JSON.
        Cada concepto debe tener: "término" (string), "definición" (string), "fuente" (string).
        La definición debe ser concisa, de 20-30 palabras.
        Devuelve solo el array JSON, sin texto adicional.
        Texto: ${textosPDF.join('\n')}
      `;

      const result = await model.generateContent(prompt);
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
      alert('Error al procesar los PDFs o al comunicarse con la IA.');
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
          <h2>Subir PDFs para generar conceptos</h2>
          <div className="upload-container">
            <input
              type="file"
              id="pdf-upload"
              multiple
              accept=".pdf"
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
              disabled={archivos.length === 0 || cargando}
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