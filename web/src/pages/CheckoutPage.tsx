import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Zap,
  Building2,
  Banknote,
  Store,
  Clock,
  Phone,
  Edit3,
  Home,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { usePayments } from '../context/PaymentsContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/shared/Input';
import { Button } from '../components/shared/Button';
import { WompiCheckout } from '../components/payment/WompiCheckout';

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingNotes: string;
}

interface FormErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
}

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { createOrder, changeOrderStatus } = useOrders();
  const { createPayment } = usePayments();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.profile?.phone || '',
    shippingAddress: user?.profile?.address || '',
    shippingCity: user?.profile?.city || '',
    shippingPostalCode: user?.profile?.postalCode || '',
    shippingNotes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // Estado para dirección: usar guardada o personalizar
  const hasSavedAddress = Boolean(user?.profile?.address && user?.profile?.city);
  const [useSavedAddress, setUseSavedAddress] = useState(hasSavedAddress);

  // Colores de marca dinámicos
  const brandColors = settings.appearance?.brandColors || settings.general?.brandColors || {
    primary: '#7c3aed',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };
  const gradientStyle = `linear-gradient(to right, ${brandColors.primary}, ${brandColors.secondary}, ${brandColors.accent})`;

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart.items.length, navigate]);

  // Generar referencia única para el pago
  useEffect(() => {
    const ref = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setPaymentReference(ref);
  }, []);

  // Obtener métodos de pago activos desde settings
  const activePaymentMethods = (settings.payment?.methods || []).filter((m) => m.isActive);
  const selectedMethod = activePaymentMethods.find((m) => m.id === selectedPaymentMethod);
  const wompiConfig = selectedMethod?.type === 'wompi' ? selectedMethod.wompiConfig : undefined;

  // Seleccionar primer método de pago activo por defecto
  useEffect(() => {
    if (activePaymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(activePaymentMethods[0].id);
    }
  }, [activePaymentMethods, selectedPaymentMethod]);

  // Icono según tipo de método de pago
  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'wompi':
        return <Zap className="w-5 h-5" />;
      case 'transfer':
        return <Building2 className="w-5 h-5" />;
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'pickup':
        return <Store className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'El nombre es requerido';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Email inválido';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'El teléfono es requerido';
    }

    if (!formData.shippingAddress.trim()) {
      newErrors.shippingAddress = 'La dirección es requerida';
    }

    if (!formData.shippingCity.trim()) {
      newErrors.shippingCity = 'La ciudad es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const createOrderFromCart = async (status: 'pending' | 'paid' = 'pending', transactionId?: string) => {
    const orderItems = cart.items.map((item) => {
      if (item.type === 'customized') {
        const customized = item.customizedProduct;
        // Convertir productId a número - si es string numérico parsearlo, sino usar 1
        const productId = typeof customized.productId === 'string'
          ? (Number.isNaN(Number(customized.productId)) ? 1 : Number(customized.productId))
          : Number(customized.productId);

        return {
          productId: productId,
          productName: customized.productName,
          productImage: customized.previewImages.front,
          size: customized.selectedSize,
          color: customized.selectedColor,
          quantity: item.quantity,
          unitPrice: item.price,
          customization: {
            // Preview comprimido para visualización
            designFront: customized.previewImages.front,
            designBack: customized.previewImages.back,
            // Imágenes originales en alta calidad para producción
            originalFront: customized.productionImages?.front,
            originalBack: customized.productionImages?.back,
          },
        };
      } else {
        const standardItem = item as import('../types/cart').CartItem;
        // Convertir productId a número
        const productId = typeof standardItem.product.id === 'string'
          ? (Number.isNaN(Number(standardItem.product.id)) ? 1 : Number(standardItem.product.id))
          : Number(standardItem.product.id);

        return {
          productId: productId,
          productName: standardItem.product.name,
          productImage: standardItem.product.images.front,
          size: standardItem.selectedSize,
          color: standardItem.selectedColor,
          quantity: item.quantity,
          unitPrice: item.price,
        };
      }
    });

    const order = await createOrder({
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      shippingAddress: formData.shippingAddress,
      shippingCity: formData.shippingCity,
      shippingPostalCode: formData.shippingPostalCode,
      shippingNotes: formData.shippingNotes,
      paymentMethod: (selectedMethod?.type || 'wompi') as import('../types/order').PaymentMethod,
      items: orderItems,
      subtotal: cart.subtotal,
      shippingCost: cart.shipping,
      discount: cart.discount,
      total: cart.total,
    });

    // Si el pago fue exitoso (Wompi), cambiar estado a pagado
    if (status === 'paid' && transactionId) {
      await changeOrderStatus({
        orderId: String(order.id),
        newStatus: 'paid',
        note: `Pago confirmado via Wompi. ID: ${transactionId}`,
      });
    }

    return order;
  };

  const handleWompiSuccess = async (transactionId: string) => {
    setIsSubmitting(true);

    try {
      // Crear pedido con estado pagado
      const order = await createOrderFromCart('paid', transactionId);

      // Crear registro de pago APROBADO
      await createPayment({
        orderId: Number(order.id),
        transactionId: transactionId,
        paymentMethod: 'wompi',
        amount: cart.total,
        currency: settings.general.currency || 'COP',
        payerName: formData.customerName,
        payerEmail: formData.customerEmail,
        payerPhone: formData.customerPhone,
      });

      // Limpiar carrito
      clearCart();

      showToast('¡Pago exitoso! Tu pedido ha sido confirmado.', 'success');

      // Redirigir a mis pedidos
      navigate('/orders');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al crear el pedido. Contacta soporte.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWompiError = (error: string) => {
    showToast(error, 'error');
  };

  const handleWompiClose = () => {
    showToast('Pago cancelado', 'info');
  };

  // Handler para métodos de pago manuales (transferencia, contra entrega)
  const handleManualPayment = async () => {
    if (!validateForm()) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear pedido pendiente
      const order = await createOrderFromCart('pending');

      // Crear registro de pago PENDIENTE para verificación manual
      await createPayment({
        orderId: Number(order.id),
        transactionId: paymentReference, // Usar referencia generada
        paymentMethod: selectedMethod?.type || 'transfer',
        amount: cart.total,
        currency: settings.general.currency || 'COP',
        payerName: formData.customerName,
        payerEmail: formData.customerEmail,
        payerPhone: formData.customerPhone,
      });

      clearCart();

      showToast('¡Pedido creado! Te contactaremos pronto.', 'success');

      // Redirigir a mis pedidos
      navigate('/orders');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al procesar el pedido. Intenta de nuevo.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: settings.general.currency || 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const steps = [
    { id: 'info', label: 'Información', icon: User },
    { id: 'payment', label: 'Pago', icon: CreditCard },
  ];

  const canProceedToPayment = formData.customerName && formData.customerEmail && formData.customerPhone && formData.shippingAddress && formData.shippingCity;

  if (cart.items.length === 0) {
    return null;
  }

  // Convertir total a centavos para Wompi
  const amountInCents = Math.round(cart.total * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con gradiente dinámico */}
      <div className="text-white py-6 shadow-lg" style={{ background: gradientStyle }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Finalizar Compra</h1>
              <p className="text-sm text-white/90">
                {step === 'info' ? 'Completa tu información' : 'Selecciona método de pago'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-center gap-8">
            {steps.map((s, index) => {
              const isActive = step === s.id;
              const isCompleted = steps.findIndex((x) => x.id === step) > index;

              return (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (s.id === 'info') setStep('info');
                      else if (s.id === 'payment' && canProceedToPayment) setStep('payment');
                    }}
                    className="flex flex-col items-center gap-1 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors"
                      style={{
                        borderColor: isActive ? brandColors.primary : isCompleted ? '#22c55e' : '#d1d5db',
                        backgroundColor: isActive ? `${brandColors.primary}15` : isCompleted ? '#dcfce7' : 'transparent',
                        color: isActive ? brandColors.primary : isCompleted ? '#22c55e' : '#9ca3af',
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <s.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: isActive ? brandColors.primary : isCompleted ? '#22c55e' : '#9ca3af' }}
                    >
                      {s.label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className="w-12 h-0.5 mx-4"
                      style={{ backgroundColor: isCompleted ? '#22c55e' : '#d1d5db' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Customer Information */}
            {step === 'info' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: brandColors.primary }} />
                  Información del Cliente
                </h2>

                <div className="space-y-4">
                  <Input
                    label="Nombre completo *"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    error={errors.customerName}
                    placeholder="Juan Pérez"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Correo electrónico *"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      error={errors.customerEmail}
                      placeholder="correo@ejemplo.com"
                    />
                    <Input
                      label="Teléfono *"
                      name="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      error={errors.customerPhone}
                      placeholder="300 123 4567"
                    />
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5" style={{ color: brandColors.secondary }} />
                        Dirección de Envío
                      </h3>
                      {hasSavedAddress && (
                        <button
                          type="button"
                          onClick={() => setUseSavedAddress(!useSavedAddress)}
                          className="text-sm font-medium flex items-center gap-1 hover:underline transition-colors"
                          style={{ color: brandColors.primary }}
                        >
                          {useSavedAddress ? (
                            <>
                              <Edit3 className="w-4 h-4" />
                              Usar otra dirección
                            </>
                          ) : (
                            <>
                              <Home className="w-4 h-4" />
                              Usar dirección guardada
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Dirección guardada */}
                    {useSavedAddress && hasSavedAddress ? (
                      <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${brandColors.secondary}15` }}
                          >
                            <Home className="w-5 h-5" style={{ color: brandColors.secondary }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Dirección de mi perfil</p>
                            <p className="text-sm text-gray-600 mt-1">{formData.shippingAddress}</p>
                            <p className="text-sm text-gray-600">
                              {formData.shippingCity}
                              {formData.shippingPostalCode && `, ${formData.shippingPostalCode}`}
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>

                        {/* Notas de entrega siempre visibles */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas de entrega (opcional)
                          </label>
                          <textarea
                            name="shippingNotes"
                            value={formData.shippingNotes}
                            onChange={handleInputChange}
                            rows={2}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-500 transition-all"
                            placeholder="Edificio azul, portería 24h, timbre..."
                          />
                        </div>
                      </div>
                    ) : (
                      /* Formulario de dirección personalizada */
                      <div className="space-y-4">
                        <Input
                          label="Dirección completa *"
                          name="shippingAddress"
                          value={formData.shippingAddress}
                          onChange={handleInputChange}
                          error={errors.shippingAddress}
                          placeholder="Calle 123 #45-67, Apto 301"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Ciudad *"
                            name="shippingCity"
                            value={formData.shippingCity}
                            onChange={handleInputChange}
                            error={errors.shippingCity}
                            placeholder="Bogotá"
                          />
                          <Input
                            label="Código postal"
                            name="shippingPostalCode"
                            value={formData.shippingPostalCode}
                            onChange={handleInputChange}
                            placeholder="110111"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notas de entrega (opcional)
                          </label>
                          <textarea
                            name="shippingNotes"
                            value={formData.shippingNotes}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-500 transition-all"
                            placeholder="Edificio azul, portería 24h, timbre..."
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        if (validateForm()) {
                          setStep('payment');
                        }
                      }}
                      disabled={!canProceedToPayment}
                      style={{ backgroundColor: brandColors.primary }}
                      className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar al Pago
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 'payment' && (
              <div className="space-y-6">
                {/* Resumen del cliente */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formData.customerName}</p>
                        <p className="text-sm text-gray-500">{formData.shippingAddress}, {formData.shippingCity}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep('info')}
                      className="text-sm font-medium hover:underline transition-colors"
                      style={{ color: brandColors.primary }}
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {/* Selección de método de pago */}
                {activePaymentMethods.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" style={{ color: brandColors.accent }} />
                      Método de Pago
                    </h2>

                    <div className="space-y-3 mb-6">
                      {activePaymentMethods.map((method) => {
                        const isSelected = selectedPaymentMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className="w-full p-4 rounded-xl border-2 transition-all text-left"
                            style={{
                              borderColor: isSelected ? brandColors.primary : '#e5e7eb',
                              backgroundColor: isSelected ? `${brandColors.primary}08` : 'transparent',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: isSelected ? `${brandColors.primary}20` : '#f3f4f6',
                                  color: isSelected ? brandColors.primary : '#6b7280',
                                }}
                              >
                                {getPaymentIcon(method.type)}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{method.name}</p>
                                {method.description && (
                                  <p className="text-sm text-gray-500">{method.description}</p>
                                )}
                              </div>
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                                style={{
                                  borderColor: isSelected ? brandColors.primary : '#d1d5db',
                                  backgroundColor: isSelected ? brandColors.primary : 'transparent',
                                }}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Área de pago según método seleccionado */}
                    {selectedMethod?.type === 'wompi' && wompiConfig && (
                      <div className="border-t pt-6">
                        <WompiCheckout
                          publicKey={wompiConfig.publicKey}
                          integrityKey={wompiConfig.integrityKey}
                          amountInCents={amountInCents}
                          reference={paymentReference}
                          customerEmail={formData.customerEmail}
                          customerFullName={formData.customerName}
                          customerPhone={formData.customerPhone}
                          onPaymentSuccess={handleWompiSuccess}
                          onPaymentError={handleWompiError}
                          onClose={handleWompiClose}
                          isTestMode={wompiConfig.isTestMode}
                        />
                      </div>
                    )}

                    {/* Transferencia Bancaria */}
                    {selectedMethod?.type === 'transfer' && (
                      <div className="border-t pt-6">
                        {selectedMethod.bankInfo && (
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-3">Datos para transferencia:</p>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><span className="font-medium">Banco:</span> {selectedMethod.bankInfo.bankName}</p>
                              <p><span className="font-medium">Tipo:</span> {selectedMethod.bankInfo.accountType}</p>
                              <p><span className="font-medium">Número:</span> {selectedMethod.bankInfo.accountNumber}</p>
                              <p><span className="font-medium">Titular:</span> {selectedMethod.bankInfo.accountHolder}</p>
                              <p><span className="font-medium">{selectedMethod.bankInfo.documentType}:</span> {selectedMethod.bankInfo.documentNumber}</p>
                            </div>
                          </div>
                        )}
                        {selectedMethod.instructions && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-700">{selectedMethod.instructions}</p>
                          </div>
                        )}
                        <button
                          onClick={handleManualPayment}
                          disabled={isSubmitting}
                          style={{ background: gradientStyle }}
                          className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5" />
                          )}
                          Confirmar Pedido - {formatCurrency(cart.total)}
                        </button>
                      </div>
                    )}

                    {/* Contra Entrega */}
                    {selectedMethod?.type === 'cash' && (
                      <div className="border-t pt-6">
                        {selectedMethod.instructions && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-700">{selectedMethod.instructions}</p>
                          </div>
                        )}
                        <button
                          onClick={handleManualPayment}
                          disabled={isSubmitting}
                          style={{ background: gradientStyle }}
                          className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Banknote className="w-5 h-5" />
                          )}
                          Confirmar Pedido - {formatCurrency(cart.total)}
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                          Pagarás {formatCurrency(cart.total)} al momento de recibir tu pedido
                        </p>
                      </div>
                    )}

                    {/* Punto Físico */}
                    {selectedMethod?.type === 'pickup' && (
                      <div className="border-t pt-6">
                        {selectedMethod.pickupConfig && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Store className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {selectedMethod.pickupConfig.storeName}
                                </h4>
                                <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                                  <p className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-green-600" />
                                    {selectedMethod.pickupConfig.address}, {selectedMethod.pickupConfig.city}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-green-600" />
                                    {selectedMethod.pickupConfig.scheduleWeekdays}
                                  </p>
                                  {selectedMethod.pickupConfig.scheduleWeekends && (
                                    <p className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-green-600" />
                                      {selectedMethod.pickupConfig.scheduleWeekends}
                                    </p>
                                  )}
                                  {selectedMethod.pickupConfig.phone && (
                                    <p className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-green-600" />
                                      {selectedMethod.pickupConfig.phone}
                                    </p>
                                  )}
                                </div>
                                {selectedMethod.pickupConfig.mapUrl && (
                                  <a
                                    href={selectedMethod.pickupConfig.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                                  >
                                    <MapPin className="w-4 h-4" />
                                    Ver en Google Maps
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedMethod.instructions && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">{selectedMethod.instructions}</p>
                          </div>
                        )}
                        <button
                          onClick={handleManualPayment}
                          disabled={isSubmitting}
                          style={{ background: gradientStyle }}
                          className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Store className="w-5 h-5" />
                          )}
                          Reservar para Recoger - {formatCurrency(cart.total)}
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                          Pagarás {formatCurrency(cart.total)} al recoger tu pedido en tienda
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensaje si no hay métodos de pago activos */}
                {activePaymentMethods.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No hay métodos de pago disponibles en este momento.</p>
                    </div>
                  </div>
                )}

                {/* Botón volver */}
                <div className="flex justify-start">
                  <button
                    onClick={() => setStep('info')}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen del Pedido</h2>

              {/* Lista de productos */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.items.map((item) => {
                  const isCustomized = item.type === 'customized';
                  let name: string;
                  let image: string;
                  let color: string;
                  let colorHex: string;
                  let size: string;

                  if (isCustomized) {
                    const customized = item.customizedProduct;
                    name = customized.productName;
                    image = customized.previewImages.front;
                    color = customized.selectedColorName || 'Personalizado';
                    colorHex = customized.selectedColor;
                    size = customized.selectedSize;
                  } else {
                    const standardItem = item as import('../types/cart').CartItem;
                    name = standardItem.product.name;
                    image = standardItem.product.images.front;
                    colorHex = standardItem.selectedColor;
                    // Buscar nombre del color en el producto
                    const colorObj = standardItem.product.colors.find(c => c.hexCode === standardItem.selectedColor);
                    color = colorObj?.name || standardItem.selectedColor;
                    size = standardItem.selectedSize;
                  }

                  return (
                    <div key={item.id} className="flex gap-3">
                      <img src={image} alt={name} className="w-12 h-12 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: colorHex }}
                              title={color}
                            />
                            <span className="text-xs text-gray-500">{color}</span>
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">Talla: {size}</span>
                        </div>
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="font-medium">{formatCurrency(cart.tax)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className={`font-medium ${cart.shipping === 0 ? 'text-green-600' : ''}`}>
                    {cart.shipping === 0 ? 'Gratis' : formatCurrency(cart.shipping)}
                  </span>
                </div>

                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span className="font-medium">-{formatCurrency(cart.discount)}</span>
                  </div>
                )}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-gray-900">{formatCurrency(cart.total)}</span>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Pago 100% seguro</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Envío con seguimiento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
