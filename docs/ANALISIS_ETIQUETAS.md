# Análisis de Aprovechamiento de Espacio - Etiquetas

## Dimensiones de Hojas

| Tipo | Ancho (cm) | Alto (cm) | Ancho (pts) | Alto (pts) | Área (cm²) |
|------|------------|-----------|-------------|------------|------------|
| A4 | 21.0 | 29.7 | 595.28 | 841.89 | 623.7 |
| A3 | 29.7 | 42.0 | 841.89 | 1190.55 | 1247.4 |
| Letter | 21.6 | 27.9 | 612.00 | 792.00 | 602.64 |

## Configuración Actual (Por Defecto)

- **Tamaño etiqueta**: 6 × 9 cm (170.08 × 255.12 pts)
- **Margen página**: 1.06 cm (30 pts)
- **Separación entre etiquetas**: 0.35 cm (10 pts)

### Cálculo de Etiquetas por Hoja

#### A4 (21 × 29.7 cm)
- **Área útil**: (21 - 2.12) × (29.7 - 2.12) = 18.88 × 27.58 cm
- **Columnas**: floor((595.28 - 60 + 10) / (170.08 + 10)) = floor(545.28 / 180.08) = **3 columnas**
- **Filas**: floor((841.89 - 60 + 10) / (255.12 + 10)) = floor(791.89 / 265.12) = **2 filas**
- **Total**: **6 etiquetas por hoja**
- **Aprovechamiento**: (6 × 54) / 623.7 = **52.0%**

#### A3 (29.7 × 42 cm)
- **Área útil**: (29.7 - 2.12) × (42 - 2.12) = 27.58 × 39.88 cm
- **Columnas**: floor((841.89 - 60 + 10) / (170.08 + 10)) = floor(791.89 / 180.08) = **4 columnas**
- **Filas**: floor((1190.55 - 60 + 10) / (255.12 + 10)) = floor(1140.55 / 265.12) = **4 filas**
- **Total**: **16 etiquetas por hoja**
- **Aprovechamiento**: (16 × 54) / 1247.4 = **69.3%**

#### Letter (21.6 × 27.9 cm)
- **Área útil**: (21.6 - 2.12) × (27.9 - 2.12) = 19.48 × 25.78 cm
- **Columnas**: floor((612 - 60 + 10) / (170.08 + 10)) = floor(562 / 180.08) = **3 columnas**
- **Filas**: floor((792 - 60 + 10) / (255.12 + 10)) = floor(742 / 265.12) = **2 filas**
- **Total**: **6 etiquetas por hoja**
- **Aprovechamiento**: (6 × 54) / 602.64 = **53.7%**

---

## Tamaños Alternativos de Etiquetas

### Etiqueta 4 × 6 cm (Pequeña)

**Dimensiones**: 113.39 × 170.08 pts
**Margen**: 1.06 cm | **Separación**: 0.35 cm

#### A4
- **Columnas**: floor((595.28 - 60 + 10) / (113.39 + 10)) = **4 columnas**
- **Filas**: floor((841.89 - 60 + 10) / (170.08 + 10)) = **4 filas**
- **Total**: **16 etiquetas** ✨
- **Aprovechamiento**: (16 × 24) / 623.7 = **61.5%**

#### A3
- **Columnas**: floor((841.89 - 60 + 10) / (113.39 + 10)) = **6 columnas**
- **Filas**: floor((1190.55 - 60 + 10) / (170.08 + 10)) = **6 filas**
- **Total**: **36 etiquetas** ✨
- **Aprovechamiento**: (36 × 24) / 1247.4 = **69.2%**

#### Letter
- **Columnas**: floor((612 - 60 + 10) / (113.39 + 10)) = **4 columnas**
- **Filas**: floor((792 - 60 + 10) / (170.08 + 10)) = **4 filas**
- **Total**: **16 etiquetas** ✨
- **Aprovechamiento**: (16 × 24) / 602.64 = **63.7%**

---

### Etiqueta 7 × 10 cm (Grande)

**Dimensiones**: 198.43 × 283.46 pts
**Margen**: 1.06 cm | **Separación**: 0.35 cm

#### A4
- **Columnas**: floor((595.28 - 60 + 10) / (198.43 + 10)) = **2 columnas**
- **Filas**: floor((841.89 - 60 + 10) / (283.46 + 10)) = **2 filas**
- **Total**: **4 etiquetas**
- **Aprovechamiento**: (4 × 70) / 623.7 = **44.9%**

#### A3
- **Columnas**: floor((841.89 - 60 + 10) / (198.43 + 10)) = **3 columnas**
- **Filas**: floor((1190.55 - 60 + 10) / (283.46 + 10)) = **3 filas**
- **Total**: **9 etiquetas**
- **Aprovechamiento**: (9 × 70) / 1247.4 = **50.5%**

#### Letter
- **Columnas**: floor((612 - 60 + 10) / (198.43 + 10)) = **2 columnas**
- **Filas**: floor((792 - 60 + 10) / (283.46 + 10)) = **2 filas**
- **Total**: **4 etiquetas**
- **Aprovechamiento**: (4 × 70) / 602.64 = **46.5%**

---

## Recomendaciones de Optimización

### 1. Ajustar Márgenes según Tipo de Hoja

**Problema**: Margen de 1.06 cm puede ser excesivo para impresoras modernas.

**Recomendaciones**:
- **Impresoras láser**: Margen de 0.5-0.7 cm (14-20 pts)
- **Impresoras de inyección**: Margen de 0.7-1.0 cm (20-28 pts)
- **Impresoras térmicas**: Margen de 0.3-0.5 cm (8-14 pts)

**Ganancia con margen 0.7 cm en A4 (6×9 cm)**:
- Columnas: floor((595.28 - 40 + 10) / 180.08) = **3 columnas** (igual)
- Filas: floor((841.89 - 40 + 10) / 265.12) = **3 filas** (¡+1 fila!)
- **Total**: **9 etiquetas** (+50% más)

### 2. Reducir Separación entre Etiquetas

**Problema**: 0.35 cm de separación ocupa espacio valioso.

**Recomendaciones**:
- **Mínimo recomendado**: 0.2 cm (5-6 pts) para corte manual
- **Con guillotina**: 0.1 cm (3 pts)
- **Etiquetas autoadhesivas**: 0.15 cm (4 pts)

**Ganancia con separación 0.2 cm en A4 (6×9 cm, margen 0.7cm)**:
- Columnas: floor((595.28 - 40 + 5.67) / 175.75) = **3 columnas**
- Filas: floor((841.89 - 40 + 5.67) / 260.79) = **3 filas**
- **Total**: **9 etiquetas**

### 3. Tamaños Óptimos por Tipo de Hoja

#### Para A4 (máximo aprovechamiento)

| Tamaño (cm) | Columnas | Filas | Total | Aprov. | Uso Recomendado |
|-------------|----------|-------|-------|--------|-----------------|
| 5 × 7 | 4 | 4 | 16 | 64% | Ropa infantil, accesorios |
| 6 × 9 | 3 | 3 | 9 | 62% | **Ropa general** ⭐ |
| 5.5 × 8.5 | 3 | 3 | 9 | 60% | Alternativa balanceada |
| 7 × 10 | 2 | 2 | 4 | 45% | Productos premium |

*Con margen 0.7 cm y separación 0.2 cm*

#### Para A3 (máximo aprovechamiento)

| Tamaño (cm) | Columnas | Filas | Total | Aprov. | Uso Recomendado |
|-------------|----------|-------|-------|--------|-----------------|
| 4 × 6 | 7 | 6 | 42 | 81% | Pequeños accesorios ⭐ |
| 5 × 7 | 5 | 5 | 25 | 70% | Ropa infantil |
| 6 × 9 | 4 | 4 | 16 | 69% | Ropa general |
| 7 × 10 | 3 | 4 | 12 | 67% | Productos grandes |

*Con margen 0.7 cm y separación 0.2 cm*

### 4. Configuraciones Óptimas Recomendadas

#### Configuración ALTA PRODUCCIÓN (máximo rendimiento)
```
Etiqueta: 5 × 7 cm
Margen: 0.7 cm
Separación: 0.2 cm
Hoja: A4

Resultado:
- 16 etiquetas/hoja
- Aprovechamiento: 64%
- Ideal para: Producción masiva
```

#### Configuración ESTÁNDAR (balance calidad-cantidad) ⭐
```
Etiqueta: 6 × 9 cm
Margen: 0.7 cm
Separación: 0.25 cm
Hoja: A4

Resultado:
- 9 etiquetas/hoja
- Aprovechamiento: 62%
- Ideal para: Uso general de ropa
```

#### Configuración PREMIUM (máxima calidad)
```
Etiqueta: 7 × 10 cm
Margen: 1.0 cm
Separación: 0.4 cm
Hoja: A4

Resultado:
- 4 etiquetas/hoja
- Aprovechamiento: 45%
- Ideal para: Productos de alto valor
```

### 5. Tabla de Referencia Rápida

#### Aprovechamiento por Combinación (A4, margen 0.7cm, sep 0.2cm)

| Etiqueta | Columnas | Filas | Total | Aprov. | ⭐ |
|----------|----------|-------|-------|--------|-----|
| 4 × 6 cm | 4 | 4 | **16** | 61% | ⭐⭐⭐ |
| 5 × 7 cm | 4 | 4 | **16** | 64% | ⭐⭐⭐⭐⭐ |
| 5.5 × 8 cm | 3 | 3 | 9 | 60% | ⭐⭐⭐ |
| 6 × 9 cm | 3 | 3 | **9** | 62% | ⭐⭐⭐⭐ |
| 6.5 × 9.5 cm | 3 | 3 | 9 | 67% | ⭐⭐⭐⭐ |
| 7 × 10 cm | 2 | 2 | 4 | 45% | ⭐⭐ |

### 6. Consejos Prácticos

1. **Prueba de Impresión**: Siempre haz una prueba en papel normal antes de usar papel adhesivo.

2. **Calibración de Márgenes**: Mide los márgenes reales de tu impresora con una regla.

3. **Orientación de Etiqueta**:
   - Etiquetas verticales (alto > ancho) = mejor para ropa
   - Etiquetas horizontales = mejor para productos en cajas

4. **Desperdicio Aceptable**:
   - 50-60% = Aceptable para etiquetas grandes
   - 60-70% = Bueno para uso general
   - 70-80% = Excelente aprovechamiento
   - 80%+ = Óptimo (solo con etiquetas muy pequeñas)

5. **Ajuste por Tipo de Corte**:
   - Corte manual con tijera: +0.3 cm de separación
   - Corte con guillotina: +0.1 cm de separación
   - Pre-cortadas: 0 cm de separación

---

## Resumen Ejecutivo

### Configuración Actual (6×9 cm, A4)
- ✅ **Ventajas**: Tamaño adecuado para mostrar toda la información
- ❌ **Desventajas**: Solo 6 etiquetas/hoja (52% aprovechamiento)
- 🎯 **Mejora propuesta**: Reducir márgenes a 0.7cm → **9 etiquetas/hoja (+50%)**

### Mejor Configuración Recomendada
```
📋 Etiqueta: 5 × 7 cm
📏 Margen: 0.7 cm
📐 Separación: 0.2 cm
📄 Hoja: A4
📊 Resultado: 16 etiquetas/hoja (64% aprovechamiento)
💰 Ahorro: 166% más etiquetas por hoja vs. configuración actual
```

### Acción Inmediata Sugerida

1. **Cambiar configuración por defecto**:
   - Margen: 30 pts → 20 pts (de 1.06 cm a 0.7 cm)
   - Separación: 10 pts → 5-6 pts (de 0.35 cm a 0.2 cm)
   - **Resultado**: De 6 a 9 etiquetas (+50% rendimiento)

2. **Crear plantilla adicional "Alta Producción"**:
   - Etiqueta: 5 × 7 cm
   - Margen: 0.7 cm
   - Separación: 0.2 cm
   - **Resultado**: 16 etiquetas/hoja
