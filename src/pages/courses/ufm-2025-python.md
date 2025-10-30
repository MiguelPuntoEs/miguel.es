---
title: "Python for Finance"
description: "Python for Finance"
layout: "../../layouts/MarkdownLayout.astro"
---
*Universidad Francisco Marroquín* 

**Profesor:** Miguel González Calvo  
**Programa académico:** Licenciatura en Entrepreneurship, Licenciatura en Administración de Empresas

## Sesiones
### Bloque 1: Introducción
**Sesión 1** - lunes, 1 de septiembre:
* Introducción. Bibliotecas. Fuentes de información

**Sesión 2** - miércoles, 3 de septiembre:
* Entorno de desarrollo
### Bloque 2: Python básico
**Sesión 3** - lunes, 8 de septiembre:
* Python básico
### Bloque 3: Análisis de datos
**Sesión 4** - miércoles, 10 de septiembre:
* Análisis de datos (i)

**Sesión 5** - lunes, 15 de septiembre:
* Análisis de datos (ii)
### Bloque 4: Estocástica
Sesión 6 - miércoles, 17 de septiembre:
* Estocástica
### Bloque 5: Código con IA
Sesión 7 - lunes, 22 de septiembre:
* Asistentes
### Bloque 6: *Machine learning*
Sesión 8 - miércoles, 24 de septiembre:
* Introducción

Sesión 9 - lunes, 29 de septiembre:
* Regresión

Sesión 10 - miércoles, 1 de octubre:
* Clasificación

Sesión 11 - lunes, 6 de octubre:
* Segmentación
### Bloque 7: *Deep learning*
Sesión 12 - miércoles, 8 de octubre:
* Introducción
* Redes neuronales (i)

Sesión 13 - lunes, 13 de octubre:
* Redes neuronales (ii)
* Bibliotecas
### Bloque 8: Series temporales
Sesión 14 - miércoles, 15 de octubre:
* Introducción y bibliotecas

Sesión 15 - lunes, 20 de octubre:
* Estacionalidad
* Descomposición
* Predicción (i)

Sesión 16 - miércoles, 22 de octubre:
* Predicción (ii)

Sesión 17 - lunes, 27 de octubre:
* Predicción (iii)
### Bloque 9: Inteligencia artificial generativa
Sesión 18 - miércoles, 29 de octubre:
* Sentiment analysis

Sesión 19 - lunes, 3 de noviembre:
* LLMs
### Sesiones de evaluación
Sesión 20 - miércoles, 5 de noviembre:
* Presentación del trabajo final

Sesión 21 - lunes, 12 de noviembre:
* Examen final de la asignatura

## Descripción
Este curso ofrece una introducción práctica y progresiva al uso de Python en el ámbito financiero y económico, combinando fundamentos de programación con aplicaciones avanzadas de análisis de datos, modelización estocástica, machine learning y técnicas de inteligencia artificial. Está diseñado para estudiantes que buscan adquirir competencias en programación aplicada a la resolución de problemas financieros.

## Contenidos

Bloques:

1. Introducción
	* Python en finanzas
	* Bibliotecas. [Pypi](https://pypi.org) Bibliotecas específicas de economía y finanzas
	* Fuentes de información [económica](https://www.miguel.es/resources/economic-sources) y financiera
	* Entorno de desarrollo:
		* Gestores de paquetes. [uv](https://docs.astral.sh/uv/), [poetry](https://python-poetry.org), [pip](https://pip.pypa.io/en/stable/)
		* IDE. [Visual Studio Code](https://code.visualstudio.com). Extensiones
		* [*Jupyter notebooks*](https://jupyter.org)
2. Python básico
	* Tipos básicos y estructuras de datos
	* `if`, `for`, `while`
	* [`numpy`](https://numpy.org)
	* Introducción a la programación orientada a objetos
3. Análisis de datos
	* [`pandas`](https://pandas.pydata.org/docs/)
	* Representación gráfica: [`matplotlib`](https://matplotlib.org/stable/users/index.html), [`plotly`](https://plotly.com/python/)
	* *Exploratory data analysis* (EDA)
	* *Data cleaning*
4. Estocástica
	* Valoración de opciones. Opciones europeas. Opciones americanas.
	* Medidas de riesgo. Value-at-Risk
5. Código con inteligencia artificial
	* Asistentes. GitHub Copilot. Cursor. Claude. Windsurf
	* Codificar con IA
6. *Machine learning*
	* Introducción al *machine learning*
	* Aprendizaje supervisado/no supervisado
	* Bibliotecas de *machine learning*. [`scikit-learn`](https://scikit-learn.org/stable/)
	* Análisis de regresión
		* Regresión lineal
		* Regresión logística
	* Clasificación
		* Clasificador binario
		* Métricas. *Precision*/*Recall*. *F1-Score*. Curva ROC. AUC.
		* Clasificador multi-clase
	* Segmentación
		* k-means
		* DBSCAN
		* Aplicaciones. *Recency, Frequency, Monetary value* (RFM)
7. *Deep learning*
	* Introducción al *deep learning*
	* Redes neuronales
	* Bibliotecas de *deep learning*. [TensorFlow](https://www.tensorflow.org/?hl=es). [PyTorch](https://pytorch.org)
8. Series temporales
	* Introducción
	* Bibliotecas de series temporales. [`darts`](https://unit8co.github.io/darts/)
	* Estacionalidad
	* Descomposición. STL
	* Predicción. [Modelos de predicción](https://unit8co.github.io/darts/generated_api/darts.models.forecasting.html)
		* Naive
		* *Exponential Smoothing*
		* ARIMA
		* *Dynamic harmonic regression*
9. Inteligencia artificial generativa
	* Sentiment analysis. [`nltk`](https://www.nltk.org)
	* LLMs. LangChain. [Modelos de chat](https://python.langchain.com/docs/concepts/chat_models/)

## Evaluación

- 60% zona:
    - 40% trabajo de la asignatura
    - 20% presentación oral del trabajo
- 40% examen final

### Trabajo de la asignatura
Se seleccionará un tema que guarde relación con uno de los contenidos de la asignatura y se realizará un análisis con profundidad del mismo usando las herramientas expuestas en la misma. Se evaluará no sólo el rigor académico sino la precisión técnica. Se exige la utilización de fuentes externas y la correcta citación de las mismas.

La valoración del trabajo se realizará en base a dos elementos:

- **Trabajo escrito:** se entregará hasta el día *2 de noviembre* a las 23:59 CET.
- **Presentación oral del trabajo:** se realizará el día 5 de noviembre.

El trabajo escrito consistirá en un *Jupyter notebook* (fichero `*.ipynb`), correctamente documentado, y si se considera necesario, se podrán entregar ficheros auxiliares (`*.py`).

## Bibliografía[^1]

Básica:
* Aurélien Geron. Hands-On Machine Learning with Scikit-Learn & TensorFlow
* Python [official documentation](https://docs.python.org/)

Finanzas:
* Hilpisch, Yves. Python for Finance: Mastering Data-Driven Finance

Estadística, matemáticas:
* Peter Bruce, Andrew Bruce, Peter Gedeck. Practical Statistics for Data Scientists: 50+ Essential Concepts using R and Python
* Marc Peter Deisenroth, A. Aldo Faisal, Cheng Soon Ong. Mathematics for Machine Learning
* Andriy Burkov. The Hundred-Page Machine Learning Book
* Trevor Hastie, Robert Tibshirani, Jerome Friedman. The Elements of Statistical Learning

Series temporales:
* Rob J Hyndman & George Athanasopoulos. [Forecasting: Principles and Practice](https://otexts.com/fpp3/)
* James D. Hamilton. Time Series Analysis

LLMs:
* Jay Alammar, Maarten Grootendorst. Hands-On Large Language Models
* Daniel Jurafsky & James H. Martin. Speech and Language Processing

General:
* Noah Gift, Alfredo Deza. Practical MLOps: Operationalizing Machine Learning Models
* Chip Huyen. AI Engineering: Building Applications with Foundational Models

Python avanzado:
* Luciano Ramalho. Fluent Python: Clear, Concise, and Effective Programming
* Leonardo Giordani. Clean Architectures in Python
* Bob Gregory & Harry Percival. Architecture Patterns with Python: Enabling Test-Driven Development, Domain-Driven Design, and Event-Driven Microservices
* Micha Gorelick & Ian Ozsvald. High Performance Python: Practical Performant Programming for Humans
* David M. Beazley. Python Distilled

Otros:
* Pedro Domingos. The Master Algorithm: How the Quest for the Ultimate Learning Machine Will Remake Our World
* Valliappa Lakshmanan, Sara Robinson & Michael Munn. Machine Learning Design Patterns: Solutions to Common Challenges in Data Preparation, Model Bulding, and MLOps
* Robert C. Martin. Clean Code: A Handbook of Agile Software Craftsmanship
* David Spiegelhalter. The Art of Statistics: Learning from Data
* Brent Dykes. Effective Data Storytelling: How to Drive Change with Data, Narrative and Visuals

[^1]: Una lista de bibliografía generalista puede ser consultada en [miguel.es](https://www.miguel.es/resources/machine-learning).