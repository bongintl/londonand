var m = require('mithril');
var PREFIXED_TRANSFORM = require('detectcss').prefixed('transform');

var closest = require('./lib/closest');

var cities = require('./data.json');

var showShape = require('./shapes')( cities.map( c => c.paths ) );

var LIST_ITEM_HEIGHT = 31;
var LIST_HEIGHT = LIST_ITEM_HEIGHT * cities.length;
var MARGIN = () => window.innerWidth <= 668 ? LIST_ITEM_HEIGHT * .45 : LIST_ITEM_HEIGHT;

var scrollTop = LIST_HEIGHT - MARGIN()
var el = document.querySelector('.cities');

var animating = -1;
var speed = 1;

var ListItem = {
    
    scrollTo: ( to, i ) => {
        
        if ( animating !== -1 ) return;
        
        var from = scrollTop;
        var distance = to - from;
        
        if ( distance === 0 ) return;
        
        animating = i;
        var duration = Math.abs( distance ) / speed;
        var startTime = Date.now();
        var endTime = startTime + duration;
        
        var tick = () => {
            
            var now = Date.now();
            
            if ( now > endTime ) {
                
                scrollTop = to;
                
                animating = -1;
                
            } else {
                
                var progress = ( now - startTime ) / duration;
                
                progress = progress < .5
                    ? 2 * progress * progress
                    : -1 + ( 4 - 2 * progress ) * progress
                
                scrollTop = from + distance * progress;
                
                requestAnimationFrame( tick );
                
            }
            
            renderList();
            
        }
        
        tick();
        
    },
    
    view: vnode => {
        
        return m('li',
            {
                class: vnode.attrs.active ? 'active' : '',
                onclick: () => vnode.state.scrollTo( vnode.attrs.y, vnode.attrs.key )
            },
            vnode.children
        );
        
    }
    
}

function renderList () {
    
    var startIdx = Math.floor( scrollTop / LIST_ITEM_HEIGHT );
    
    var listOffset = ( startIdx * LIST_ITEM_HEIGHT ) - scrollTop;
    
    var i = startIdx;
    var y = listOffset;
    var h = window.innerHeight;
    
    var lis = [];
    
    while ( y < h ) {
        
        var cityIdx = i % cities.length
        
        lis.push( m( ListItem,
            {
                key: i,
                active: animating === -1 ? i - startIdx === 1 : i === animating,
                y: scrollTop + y - MARGIN()
            },
            cities[ cityIdx ].name
        ));
        
        i++;
        
        y += LIST_ITEM_HEIGHT;
        
    }
    
    showShape( ( startIdx + 1 ) % cities.length );
    
    m.render( el, m('ul',
        
        {
            style: {
                
                [PREFIXED_TRANSFORM]: `translateY(${listOffset}px)`
                
            }
        },
        
        lis
        
    ));
    
}

function scroll( delta ) {
    
    if ( animating !== -1 ) return;
    
    scrollTop += delta;
    
    if ( scrollTop < 0 ) scrollTop += LIST_HEIGHT;
    
    renderList();
    
}

window.addEventListener('mousewheel', function( e ){
    
    if ( closest( e.target, '.about' ) !== null ) return;
    
    scroll( e.deltaY * .5 );
    
})

var lastTouch;

window.addEventListener('touchstart', e => {
    
    if ( closest( e.target, '.about' ) !== null ) return;
    
    lastTouch = e.touches[0].clientY;
    
})

window.addEventListener( 'touchmove', e => {
    
    if ( closest( e.target, '.about' ) !== null ) return;
    
    var y = e.touches[0].clientY;
    
    scroll( lastTouch - y );
    
    lastTouch = y;
    
    if ( lastTouch < 0 ) lastTouch += LIST_HEIGHT;
    
})

window.addEventListener('resize', renderList);

renderList();