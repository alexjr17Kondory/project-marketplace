# Optimización de Etiquetas Aplicada

## Resumen de Cambios

Se ha actualizado la configuración por defecto de las plantillas de etiquetas para maximizar el aprovechamiento del espacio en las hojas de impresión.

## Configuración Anterior vs. Nueva

### ❌ Antes (Configuración Subóptima)
```
Tamaño etiqueta: 6 × 9 cm (170.08 × 255.12 pts)
Margen de página: 1.06 cm (30 pts)
Separación entre etiquetas: 0.35 cm (10 pts)
Tipo de hoja: A4

Resultado en A4:
- Columnas: 3
- Filas: 2
- Total: 6 etiquetas por hoja
- Aprovechamiento: 52.0%
```

### ✅ Ahora (Configuración Optimizada)
```
Tamaño etiqueta: 6 × 9 cm (170.08 × 255.12 pts) [SIN CAMBIO]
Margen de página: 0.7 cm (20 pts) ⬇️ Reducido 34%
Separación entre etiquetas: 0.2 cm (5.67 pts) ⬇️ Reducido 43%
Tipo de hoja: A4

Resultado en A4:
- Columnas: 3
- Filas: 3
- Total: 9 etiquetas por hoja ⬆️ +50%
- Aprovechamiento: 62.0% ⬆️ +10 puntos
```

## Beneficios

### 📊 Mejora en Producción
- **+3 etiquetas por hoja** (de 6 a 9)
- **+50% de rendimiento** en cada impresión
- **Ahorro de papel**: Reducción del 33% en consumo de hojas

### 💰 Impacto Económico
Si imprimes 100 etiquetas:
- **Antes**: 17 hojas necesarias (100 ÷ 6 = 16.67 → 17)
- **Ahora**: 12 hojas necesarias (100 ÷ 9 = 11.11 → 12)
- **Ahorro**: 5 hojas (-29% de papel)

Si imprimes 1000 etiquetas:
- **Antes**: 167 hojas
- **Ahora**: 112 hojas
- **Ahorro**: 55 hojas (-33% de papel)

### ✅ Compatibilidad
Los márgenes optimizados son compatibles con:
- ✅ Impresoras láser modernas
- ✅ Impresoras de inyección de tinta
- ✅ La mayoría de impresoras comerciales

Los márgenes de 0.7 cm son seguros y muy superiores al mínimo técnico de 0.5 cm de la mayoría de impresoras.

## Archivos Actualizados

### Backend
1. **prisma/seeds/label-templates.seed.ts**
   - Plantilla por defecto con valores optimizados
   - `pageMargin: 20` (0.7 cm)
   - `labelSpacing: 5.67` (0.2 cm)

2. **src/services/label-templates.service.ts**
   - Valores por defecto optimizados en `createLabelTemplate()`

### Frontend
3. **web/src/pages/admin/settings/LabelTemplatesPage.tsx**
   - Estado inicial del editor con valores optimizados
   - Función `handleCreate()` con valores optimizados
   - Función `handleEdit()` con fallbacks optimizados

## Próximos Pasos Opcionales

Si deseas maximizar aún más el rendimiento, considera estas alternativas del análisis:

### Opción 1: Etiquetas más pequeñas (Alta Producción)
```
Tamaño: 5 × 7 cm
Margen: 0.7 cm
Separación: 0.2 cm

Resultado en A4:
- Total: 16 etiquetas por hoja (+166% vs. original)
- Aprovechamiento: 64%
- Ideal para: Ropa infantil, accesorios pequeños
```

### Opción 2: Hoja A3 (Producción Masiva)
```
Tamaño: 6 × 9 cm
Margen: 0.7 cm
Separación: 0.2 cm
Hoja: A3

Resultado en A3:
- Total: 16 etiquetas por hoja
- Aprovechamiento: 69%
- Ideal para: Producciones grandes, reducir cambios de hoja
```

### Opción 3: Etiquetas pequeñas en A3 (Máximo Rendimiento)
```
Tamaño: 4 × 6 cm
Margen: 0.7 cm
Separación: 0.2 cm
Hoja: A3

Resultado en A3:
- Total: 42 etiquetas por hoja (+600% vs. original)
- Aprovechamiento: 81%
- Ideal para: Accesorios muy pequeños, producción masiva
```

## Referencias

Ver análisis completo en: [ANALISIS_ETIQUETAS.md](./ANALISIS_ETIQUETAS.md)

---

**Fecha de aplicación**: Diciembre 2025
**Versión**: 6.1 - Optimización de Etiquetas
