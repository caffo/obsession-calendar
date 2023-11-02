  let polyfillJS = document.createElement('script');
  let popperJS = document.createElement('script');
  let tippyJS = document.createElement('script');

  popperJS.src = 'https://polyfill.io/v3/polyfill.min.js?features=Array.prototype.find,Promise,Object.assign';
  popperJS.src = 'https://unpkg.com/@popperjs/core@2';
  tippyJS.src = 'https://unpkg.com/tippy.js@6';

  document.head.appendChild(polyfillJS);
  document.head.appendChild(popperJS);

  popperJS.onload = function() {
    document.head.appendChild(tippyJS);
  };

  tippyJS.onload = function() {
    let tippyInstances = tippy('.days:not(.empty)', {
      content(reference) {
        const tooltip = reference.querySelector('.tooltip');
        return tooltip.innerHTML;
      }
    });

    tippy.createSingleton(tippyInstances, {
      allowHTML: true,
      arrow: false,
      maxWidth: 300,
      interactive: true,
      offset: [0,0],
      moveTransition: 'transform 0.2s ease-out',
    });
  };