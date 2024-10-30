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
