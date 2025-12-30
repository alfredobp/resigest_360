"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as WebIFC from 'web-ifc';

const IFCViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const ifcAPIRef = useRef<WebIFC.IfcAPI | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ifcReady, setIfcReady] = useState(false);
  const [modelInfo, setModelInfo] = useState<{
    elements: number;
    meshes: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log('🚀 Inicializando visor IFC...');
    
    // Evitar duplicación en React.StrictMode
    let isMounted = true;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333); // Fondo oscuro para mejor contraste
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lights - Iluminación mejorada
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Más luz ambiente
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0); // Más intensa
    directionalLight1.position.set(100, 200, 100);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8); // Más intensa
    directionalLight2.position.set(-100, 200, -100);
    scene.add(directionalLight2);
    
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight3.position.set(0, -200, 0);
    scene.add(directionalLight3);

    // Grid
    const gridHelper = new THREE.GridHelper(200, 20); // Grid más grande
    scene.add(gridHelper);

    // Axes
    const axesHelper = new THREE.AxesHelper(50); // Ejes más largos
    scene.add(axesHelper);

    // Initialize IFC API
    const ifcApi = new WebIFC.IfcAPI();
    ifcAPIRef.current = ifcApi;
    
    // Configurar path a los archivos WASM en public/wasm/
    ifcApi.SetWasmPath('/wasm/');
    
    // Inicializar WASM sin multi-threading para evitar problemas con workers en Next.js
    (async () => {
      if (!isMounted) return;
      try {
        console.log('🔄 Inicializando web-ifc en modo single-thread desde /wasm/...');
        // forceSingleThread = true para evitar problemas con Web Workers
        await ifcApi.Init(undefined, true);
        if (!isMounted) return;
        console.log('✅ WASM inicializado correctamente en modo single-thread');
        setIfcReady(true);
      } catch (err) {
        console.error('❌ Error al inicializar WASM:', err);
        setError('No se pudo inicializar el visor IFC');
      }
    })();

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      
      // Limpiar geometrías y materiales del modelo
      if (modelRef.current) {
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        scene.remove(modelRef.current);
        modelRef.current = null;
      }
      
      // Limpiar controles
      if (controls) {
        controls.dispose();
      }
      
      // Limpiar renderer
      renderer.dispose();
      if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Limpiar API de IFC
      if (ifcAPIRef.current) {
        try {
          ifcAPIRef.current.Dispose();
        } catch (e) {
          console.warn('Error limpiando IFC API:', e);
        }
      }
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.ifc')) {
      setError('Por favor selecciona un archivo IFC válido');
      return;
    }

    if (!ifcReady || !ifcAPIRef.current) {
      setError('El visor IFC aún se está inicializando. Por favor espera un momento.');
      return;
    }

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data || !ifcAPIRef.current || !sceneRef.current) {
          throw new Error('Error al leer el archivo');
        }

        // Remove previous model
        if (modelRef.current) {
          sceneRef.current.remove(modelRef.current);
          modelRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.geometry?.dispose();
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => mat.dispose());
              } else {
                mesh.material?.dispose();
              }
            }
          });
        }

        const uint8Array = new Uint8Array(data as ArrayBuffer);
        const modelID = ifcAPIRef.current.OpenModel(uint8Array);
        
        if (modelID === undefined || modelID < 0) {
          throw new Error('No se pudo abrir el modelo IFC');
        }

        const group = new THREE.Group();
        let meshCount = 0;
        
        // Simple material con colores más claros
        const material = new THREE.MeshPhongMaterial({
          color: 0xdddddd,
          side: THREE.DoubleSide,
          wireframe: false,
          shininess: 30
        });

        try {
          // Get all express IDs with geometry
          const allIds: number[] = [];
          const flatMeshes = ifcAPIRef.current.LoadAllGeometry(modelID);
          
          for (let i = 0; i < flatMeshes.size(); i++) {
            const flatMesh = flatMeshes.get(i);
            if (flatMesh.geometries.size() > 0) {
              allIds.push(flatMesh.expressID);
            }
          }
          
          console.log('📦 Total elementos con geometría:', allIds.length);
          
          // Use StreamMeshes with callback
          ifcAPIRef.current.StreamMeshes(modelID, allIds, (mesh, index, total) => {
            try {
              if (index === 0) {
                console.log('🔍 Primera mesh recibida');
              }
              
              // Process each geometry in the mesh
              for (let i = 0; i < mesh.geometries.size(); i++) {
                const geom = mesh.geometries.get(i);
                
                // Get geometry from web-ifc
                const ifcGeometry = ifcAPIRef.current!.GetGeometry(modelID, geom.geometryExpressID);
                const vData = ifcGeometry.GetVertexData();
                const vSize = ifcGeometry.GetVertexDataSize();
                const iData = ifcGeometry.GetIndexData();
                const iSize = ifcGeometry.GetIndexDataSize();
                
                if (vSize === 0 || iSize === 0) continue;
                
                // Access WASM memory directly
                const vertexArray = ifcAPIRef.current!.wasmModule.HEAPF32.subarray(vData / 4, vData / 4 + vSize);
                const indexArray = ifcAPIRef.current!.wasmModule.HEAPU32.subarray(iData / 4, iData / 4 + iSize);
                
                if (meshCount === 0) {
                  console.log('🔍 Primera geometría - vertices:', vSize, 'indices:', iSize);
                  console.log('  Primeras posiciones:', Array.from(vertexArray.slice(0, 9)));
                  console.log('  Primeros indices:', Array.from(indexArray.slice(0, 9)));
                }
                
                // Create Three.js geometry
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertexArray), 3));
                geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indexArray), 1));
                
                // Compute normals DESPUÉS de añadir position e index
                geometry.computeVertexNormals();
                
                // Verificar que la geometría es válida
                if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
                  console.warn('⚠️ Geometría sin posiciones válidas');
                  continue;
                }
                
                const threeMesh = new THREE.Mesh(geometry, material.clone());
                
                if (meshCount === 0) {
                  console.log('🔍 Primera mesh creada:', {
                    vertices: geometry.attributes.position.count,
                    triangles: geometry.index ? geometry.index.count / 3 : 0,
                    position: threeMesh.position
                  });
                }
                
                // Apply color
                if (geom.color) {
                  threeMesh.material.color.setRGB(geom.color.x, geom.color.y, geom.color.z);
                }
                
                // Apply transformation
                if (geom.flatTransformation) {
                  const matrix = new THREE.Matrix4();
                  matrix.fromArray(geom.flatTransformation);
                  threeMesh.applyMatrix4(matrix);
                  
                  if (meshCount === 0) {
                    console.log('🔍 Primera transformación:', geom.flatTransformation);
                    console.log('  Matriz aplicada:', matrix);
                  }
                } else if (meshCount === 0) {
                  console.warn('⚠️ Primera mesh sin flatTransformation');
                }
                
                group.add(threeMesh);
                meshCount++;
                
                if (meshCount === 1) {
                  console.log('✅ Primera mesh añadida al grupo');
                  console.log('   Posición mesh:', threeMesh.position);
                  console.log('   BoundingBox mesh:', new THREE.Box3().setFromObject(threeMesh));
                }
              }
            } catch (err) {
              console.warn('Error procesando mesh:', err);
            }
          });
          
          console.log('✅ Total meshes añadidas:', meshCount);
        } catch (geomError) {
          console.error('Error loading geometry:', geomError);
          throw new Error('Error al cargar la geometría del modelo');
        }

        if (meshCount === 0) {
          throw new Error('No se encontraron elementos válidos en el archivo IFC');
        }

        modelRef.current = group;
        sceneRef.current.add(group);
        
        console.log('📍 Centrando cámara en el modelo...');

        // Center camera on model
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('📦 Bounding box:', {
          center: { x: center.x, y: center.y, z: center.z },
          size: { x: size.x, y: size.y, z: size.z },
          max: Math.max(size.x, size.y, size.z)
        });
        
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0 && cameraRef.current) {
          const fov = cameraRef.current.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
          cameraZ *= 2.5; // Alejar más la cámara

          const newPos = {
            x: center.x + cameraZ,
            y: center.y + cameraZ, 
            z: center.z + cameraZ
          };
          
          console.log('📷 Nueva posición de cámara:', newPos);
          
          cameraRef.current.position.set(newPos.x, newPos.y, newPos.z);
          cameraRef.current.lookAt(center);
          
          if (controlsRef.current) {
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          }
          
          console.log('✅ Cámara actualizada');
        }
        
        console.log('🎬 Total objetos en escena:', sceneRef.current?.children.length);
        console.log('🎬 Hijos del grupo modelo:', group.children.length);
        
        // Forzar que el renderer vea las meshes
        if (group.children.length > 0) {
          const firstMesh = group.children[0] as THREE.Mesh;
          console.log('🎨 Primera mesh del modelo:', {
            visible: firstMesh.visible,
            material: firstMesh.material,
            geometry: {
              vertices: (firstMesh.geometry as THREE.BufferGeometry).attributes.position?.count,
              hasIndex: !!(firstMesh.geometry as THREE.BufferGeometry).index
            },
            position: firstMesh.position,
            worldPosition: firstMesh.getWorldPosition(new THREE.Vector3())
          });
        }

        setModelInfo({ 
          elements: meshCount,
          meshes: meshCount
        });
        setLoading(false);
      } catch (err) {
        console.error('Error loading IFC:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el archivo IFC. Verifica que sea válido.');
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const resetView = () => {
    if (cameraRef.current && controlsRef.current && modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = cameraRef.current.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;

      cameraRef.current.position.set(center.x + cameraZ, center.y + cameraZ, center.z + cameraZ);
      cameraRef.current.lookAt(center);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D Viewer */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls Panel */}
      <div className="absolute z-10 p-4 space-y-4 bg-white border border-gray-200 rounded-lg shadow-xl top-4 left-4 dark:bg-gray-800 dark:border-gray-700 w-80">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">
            Visor IFC/BIM
          </h3>
          
          {/* Upload Button */}
          <label className={`flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg cursor-pointer ${
            ifcReady ? 'bg-brand-500 hover:bg-brand-600' : 'bg-gray-400 cursor-not-allowed'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {ifcReady ? 'Cargar archivo IFC' : 'Inicializando...'}
            <input
              type="file"
              accept=".ifc"
              onChange={handleFileUpload}
              className="hidden"
              disabled={!ifcReady}
            />
          </label>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 p-3 text-sm bg-blue-50 rounded-lg dark:bg-blue-900/20">
            <div className="w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            <span className="text-blue-700 dark:text-blue-400">Cargando modelo...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Model Info */}
        {modelInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 text-xs bg-gray-50 rounded dark:bg-gray-900">
              <span className="text-gray-600 dark:text-gray-400">Elementos:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {modelInfo.elements.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 text-xs bg-gray-50 rounded dark:bg-gray-900">
              <span className="text-gray-600 dark:text-gray-400">Meshes:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {modelInfo.meshes.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {modelRef.current && (
          <div className="pt-3 space-y-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={resetView}
              className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Restablecer Vista
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="pt-3 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 dark:text-gray-400">
          <p className="mb-2 font-medium">Controles:</p>
          <ul className="space-y-1">
            <li>• Click izquierdo + arrastrar: Rotar</li>
            <li>• Rueda: Zoom</li>
            <li>• Click derecho + arrastrar: Pan</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IFCViewer;
