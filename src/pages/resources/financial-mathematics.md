---
title: "Financial Mathematics Formulas"
subtitle: "Formulario"
description: "Formulario de matemáticas financieras: interés simple, compuesto, rentas, préstamos y más"
layout: "../../layouts/MarkdownLayout.astro"
latex: true
toc: true
lang: "es"
---

Documento disponible en [PDF](/docs/financial-mathematics.pdf)

## Capitalización simple

$$C_n=C_0(1+i \cdot n)$$

- $C_0$ capital inicial
- $C_n$ capital final
- $n$ número de períodos
- $i$ tipo de interés

### Tantos equivalentes

$$i=I_k\cdot k$$

$k$ frecuencia de capitalización: número de partes iguales en las que se divide el período de referencia

Algunos ejemplos:

- $k=2$,  semestre; $i_2$ tanto de interés semestral
- $k=3$, cuatrimestre; $i_3$ tanto de interés cuatrimestral
- $k=4$, trimestre; $i_4$ tanto de interés trimestral
- $k=12$, mes; $i_{12}$ tanto de interés mensual 

### Descuento simple

$$D=C_n-C_0$$

$D$ descuento o rebaja

### Descuento racional
Se calcula utilizando la capitalización simple: $C_n=C_0(1+i \cdot n)$
Por tanto:
$$D_r=C_n-C_0=\frac{C_n \cdot n \cdot i}{1+n\cdot i}$$

### Descuento comercial

Se usa utilizando un tipo de descuento $d$

$$C_0=C_n(1-n\cdot d)$$

$d$ tipo de descuento

## Capitalización compuesta

$$C_n=C_0(1+i)^n$$

### Tantos equivalentes

$$(1+i)=(1+i_k)^k$$

### Descuento racional

$$D_r=C_n-C_0=C_n\left[1-(1+i)^{-n}\right]$$

### Descuento comercial

$$D_c=C_n-C_0=C_n\left[1-(1-d)^n\right]$$

## Rentas

Clasificación:

- Según cuantía de los términos:
	- Constante
	- Variable
		- Progresión geométrica
		- Progresión aritmética
- Según el número de términos:
	- Temporal
	- Perpetua
- Según el vencimiento del término:
	- Pospagable
	- Prepagable

## Temporal

### Pospagable

Unitaria:

$$a_{n,i}=\frac{1-(1+i)^{-n}}{i}$$

Geométrica: $A(C;q)_{n,i}$

- si $q\neq 1+i$:

$$C\frac{1-\left(\frac{q}{1+i}\right)^n}{1+i-q}$$

- si $q = 1+i$:

$$\frac{C \cdot n}{1+i}$$

Aritmética:

$$A(C,d)_{n,i}=\left(C+\frac{d}{i}+dn\right)a_{n,i}-\frac{dn}{i}$$

### Prepagable

Unitaria:

$$\ddot{a}_{n,i}=(1+i)a_{n,i}$$

Geométrica:

$$\ddot{A}(C;q)_{n,i}=(1+i)A(C;q)_{n,i}$$

Aritmética:

$$\ddot{A}(C;d)_{n,i}=(1+i)A(C;d)_{n,i}$$

### Otras

Diferida:

$$(1+i)^{-k}a_{n,i}$$

Anticipada:

$$(1+i)^h S_{n,i}$$

## Perpetua 

### Prepagable

Unitaria:

$$a_{\infty,i}=\frac{1}{i}$$

Geométrica:

- si $q<1+i$:

$$A(c;q)_{\infty,i}=\frac{C}{1+i-q}$$

- si $q\geq 1+i$: $\infty$

Aritmética:

$$A(c;d)_{\infty,i}=\left(C+\frac{d}{i}\right)\frac{1}{i}$$

### Pospagable

Unitaria:

$$\ddot{a}_{\infty,i}=(1+i)a_{\infty,i}=\frac{1+i}{i}$$

Geométrica:

$$\ddot{A}(C;q)_{\infty,i}=(1+i)A(C;q)_{\infty,i}$$

Aritmética:

$$\ddot{A}(C;d)_{\infty,i}=(1+i)A(C;d)_{\infty,i}$$

## Préstamos

Magnitudes:

- $C_0$ importe del préstamo
- $n$ número de pagos
- $i$ tipo de interés efectivo
- $a_k$ término amortizativo al final del período $k$
- $I_k$ cuota de interés del período $k$
- $A_k$ cuota de amortización en el momento $k$
- $C_k$ capital pendiente de amortización en el momento $k$
- $m_k$ capital total amortizado al final del período $k$

### Generalidades

$$a_k=I_k+A_k$$

$$m_k=A_1 + A_2 + \dots + A_k$$

$$I_k = C_{k-1} i$$

$$C_0 = A_1 + A_2 + \dots + A_n$$

$$C_k = A_{k+1} + A_{k+2} + \dots + A_n$$

$$C_k = C_0 - m_k$$

### Método francés

**Definición:** pagos pospagables, $a_k=a$

$$C_0=a\frac{1-(1+i)^{-n}}{i}$$

$$A_{k+1}=A_k(1+i)$$

$$A_{k+1} = A_1 (1+i)^k$$

$$A_1 = \frac{C_0\cdot i}{(1+i)^n - 1}$$

$$A_k=A_1(1+i)^{k-1}$$

$$m_k=A_1\frac{(1+i)^k-1}{i}$$

$$C_k=C_0(1+i)^k-a\frac{(1+i)^k-1}{i}$$

$$C_k=a\frac{1-(1+i)^{k-n}}{i}$$

### Método italiano

**Definición:** pagos pospagables, $A_k=A$

$$A=\frac{C_0}{n}$$

$$m_k=A_1+A_2+\dots+A_k=A\cdot k$$

$$C_k=C_0-k\cdot A$$

$$C_k=(n-k)A$$

### Método americano

**Definición:**

- Pagos pospagables de intereses $a_k=C_0 \cdot i$ para $k=1,2,\ldots,n-1$
- Último pago: intereses y principal $a_n=C_0(1+i)$

$$C_k=C_0\; \forall k \neq n$$

## Gestión de riesgo

Tipo spot, tipo forward

### TIR

$$P=\sum_{t=1}^n\frac{C_t}{(1+r)^t}+\frac{\text{Valor reembolso}}{(1+r)^n}$$

- $P$ precio de mercado
- $C_t$ cupón del período t
- $r$ TIR

### Duración Macaulay

$$D=\frac{1}{P}\sum_{t=1}^n \frac{F_t t}{(1+TIR)^t}$$

- $P$ precio del bono
- $F_t$ Flujo del período t (cupones y principal)
- $TIR$ tipo de interés del mercado
- $n$ número de períodos hasta vencimiento

### Duración modificada

$$D^*=\frac{D}{1+TIR}$$