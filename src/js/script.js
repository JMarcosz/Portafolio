const htmlElement = document.querySelector('html') 
// traemos nuestro elemento html utilizando document.querySelector
const toogleButton = document.querySelector('#toggle') 
// traemos nuestro botón

toogleButton.addEventListener('click', () => darkMode()) 
// le añadimos un escuchador de eventos para el evento 'click' que dispare la función darkMode

const darkMode = () => {
  htmlElement.classList.contains('dark') ?
    htmlElement.classList.remove('dark') :
    htmlElement.classList.add('dark')
} 
// esta función verifica si la etiqueta html posee la clase dark. Si la posee, la remueve, si no la posee la añade.
var copy = document.querySelector(".logos-slide").cloneNode(true);
      document.querySelector(".logos").appendChild(copy);