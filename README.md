# 🚀 Space Shooter - Arcade Retro

¡Un clásico juego de naves estilo arcade inspirado en el mítico *Space Invaders*, desarrollado completamente con tecnologías web nativas! Este proyecto fue creado con el objetivo de practicar lógica de videojuegos, manejo del DOM, colisiones y renderizado en tiempo real utilizando el elemento `<canvas>` de HTML5.

🎯 **[¡Haz clic aquí para jugar en vivo!](https://MartinIbarra.github.io/space-shooter-js/)**

---

## 🕹️ Mecánicas del Juego

* **Oleadas Progresivas:** Cada vez que elimines a todos los "monitos", una nueva fila aparecerá moviéndose más rápido.
* **Sistema de Colisiones:** Detección precisa en tiempo real entre las balas del jugador y las cajas de colisión de los enemigos.
* **Condición de Derrota:** Si los enemigos logran descender lo suficiente y alcanzan la altura de tu nave, el juego terminará.

### 🎮 Controles
* **Flecha Izquierda `[←]`**: Mover la nave a la izquierda.
* **Flecha Derecha `[→]`**: Mover la nave a la derecha.
* **Barra Espaciadora `[Espacio]`**: Disparar láseres.

---

## 🛠️ Tecnologías Utilizadas

Para mantener el proyecto ligero, de carga instantánea y fácil de desplieguer, se utilizó:

* **HTML5 (`<canvas>`)**: Para el renderizado de los gráficos 2D en tiempo real.
* **CSS3**: Estilos con temática *Cyberpunk/Arcade* utilizando sombras de neón y tipografías monoespaciadas.
* **JavaScript (ES6+)**: Lógica del juego, bucle principal (`requestAnimationFrame`), físicas básicas y control de eventos del teclado.

---

## 🚀 Instalación y Despliegue Local

No necesitas instalar dependencias ni configurar servidores locales. Para jugarlo o editarlo en tu máquina:

1. Clona este repositorio:
```bash
   git clone [https://github.com/MartinIbarra/space-shooter-js.git](https://github.com/MartinIbarra/space-shooter-js.git)