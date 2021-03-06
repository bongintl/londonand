var closest = require('./lib/closest');
var PREFIXED_TRANSFORM = require('detectcss').prefixed('transform');

var about = document.querySelector( '.about' );
var toggle = document.querySelector( '.about__toggle' );
var isOpen = false;

var open = () => {
    
    if ( !isOpen ) {
        
        about.classList.add('about_open');
        
        isOpen = true;
        
    }
    
}

var close = () => {
    
    if ( isOpen ) {
        
        about.classList.remove('about_open');
        
        isOpen = false;
        
    }
    
}

document.body.addEventListener( 'click', e => {
    
    if ( e.target.className === 'about__toggle' ) {
        
        isOpen ? close() : open();
        
    } else if ( closest( e.target, '.about' ) !== null ) {
        
        open();
        
    } else {
        
        close();
        
    }
    
});

const email = document.querySelector('.about__email');
[ ...document.querySelectorAll('.accordion') ].forEach( container => {
    const expand = container.querySelector( '.accordion__expand' );
    const body = container.querySelector( '.accordion__body' );
    const reveal = container.querySelector( '.accordion__reveal' );
    expand.addEventListener('click', () => {
        body.style.display = 'block';
        requestAnimationFrame(() => {
            reveal.style[ PREFIXED_TRANSFORM ] = 'translateY(100%)';
        })
        email.style.opacity = 0;
        email.style.pointerEvents = 'none';
    })
})

// document.querySelector('.expand').addEventListener('click', () => {
    
//     var letter = document.querySelector('.open-letter');
//     var reveal = document.querySelector('.open-letter__reveal');
//     var email = document.querySelector('.about__email');
    
//     letter.style.display = 'block';
//     email.style.opacity = 0;
//     email.style.pointerEvents = 'none';
    
//     requestAnimationFrame(() => {
//         reveal.style[ PREFIXED_TRANSFORM ] = 'translateY(100%)';
//     })
    
// })

