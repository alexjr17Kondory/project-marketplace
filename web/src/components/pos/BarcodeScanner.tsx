import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Loader2, SwitchCamera, CheckCircle } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

// Número de lecturas consecutivas requeridas para confirmar
const REQUIRED_CONFIRMATIONS = 3;

export default function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [confirmationCount, setConfirmationCount] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCodeRef = useRef<string | null>(null);
  const confirmCountRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setDetectedCode(null);
      setConfirmationCount(0);
      lastCodeRef.current = null;
      confirmCountRef.current = 0;
      initScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const initScanner = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);

        // Prefer back camera
        const backCameraIndex = devices.findIndex(
          (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera')
        );
        const cameraIndex = backCameraIndex >= 0 ? backCameraIndex : 0;
        setCurrentCameraIndex(cameraIndex);

        await startScanning(devices[cameraIndex].id);
      } else {
        setError('No se encontraron cámaras disponibles');
        setIsScanning(false);
      }
    } catch (err: any) {
      console.error('Error initializing scanner:', err);
      setError(err.message || 'Error al inicializar la cámara');
      setIsScanning(false);
    }
  };

  // Validar que el código tenga formato de código de barras válido
  const isValidBarcode = (code: string): boolean => {
    // Mínimo 4 caracteres, solo alfanuméricos y guiones
    if (code.length < 4) return false;
    // Patrón típico de códigos de barras (números o alfanuméricos)
    return /^[A-Za-z0-9\-]+$/.test(code);
  };

  const handleCodeDetected = (decodedText: string) => {
    // Validar formato básico
    if (!isValidBarcode(decodedText)) {
      return;
    }

    // Si es el mismo código que el anterior, incrementar contador
    if (decodedText === lastCodeRef.current) {
      confirmCountRef.current += 1;
      setConfirmationCount(confirmCountRef.current);
      setDetectedCode(decodedText);

      // Si alcanzamos las confirmaciones requeridas, aceptar
      if (confirmCountRef.current >= REQUIRED_CONFIRMATIONS) {
        handleScanSuccess(decodedText);
      }
    } else {
      // Nuevo código, reiniciar contador
      lastCodeRef.current = decodedText;
      confirmCountRef.current = 1;
      setConfirmationCount(1);
      setDetectedCode(decodedText);
    }
  };

  const startScanning = async (cameraId: string) => {
    try {
      // Stop previous scanner if exists
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignore stop errors
        }
      }

      // Create new scanner
      scannerRef.current = new Html5Qrcode('barcode-scanner-container');

      await scannerRef.current.start(
        cameraId,
        {
          fps: 5, // Reducido para dar más tiempo al usuario
          qrbox: { width: 220, height: 120 }, // Zona más pequeña, más precisa
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {
          // Error callback (ignore - scanning continues)
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError('Error al iniciar el escáner');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore errors on stop
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (barcode: string) => {
    // Stop scanner and return result
    stopScanner();
    onScan(barcode);
    onClose();
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;

    // Reset confirmation when switching camera
    lastCodeRef.current = null;
    confirmCountRef.current = 0;
    setDetectedCode(null);
    setConfirmationCount(0);

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanning(cameras[nextIndex].id);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-800">Escanear Código</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          <div
            ref={containerRef}
            id="barcode-scanner-container"
            className="w-full bg-black rounded-lg overflow-hidden"
            style={{ minHeight: '300px' }}
          />

          {/* Confirmation Progress */}
          {detectedCode && confirmationCount > 0 && confirmationCount < REQUIRED_CONFIRMATIONS && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-yellow-800">
                  Confirmando: {detectedCode}
                </p>
                <span className="text-xs text-yellow-600">
                  {confirmationCount}/{REQUIRED_CONFIRMATIONS}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${(confirmationCount / REQUIRED_CONFIRMATIONS) * 100}%` }}
                />
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Mantén el código centrado...
              </p>
            </div>
          )}

          {/* Success indicator (briefly shown before closing) */}
          {confirmationCount >= REQUIRED_CONFIRMATIONS && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                ¡Código detectado!
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!isScanning && !error && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">Iniciando cámara...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Centra el código y mantén firme
            </p>
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                <SwitchCamera className="w-4 h-4" />
                Cambiar cámara
              </button>
            )}
          </div>

          <button
            onClick={handleClose}
            className="w-full mt-3 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
