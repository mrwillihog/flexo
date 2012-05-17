if ( typeof Object.create !== 'function' ) {
  Object.create = function( obj ) {
    function F(){}
    F.prototype = obj;
  };
}
(function ( $, window, document, undefined ) {

  var Flexo = {
    init: function( options, element ) {
      var self = this;

      self.element  = element;
      self.$element = $( element );

      if ( options.images !== undefined ) {
        // Object was passed
        self.originalImages = options.images;
        self.options = $.extend( {}, $.fn.flexo.options, options );
      } else {
        // Just the image array was passed
        self.originalImages = options;
        self.options = $.extend( {}, $.fn.flexo.options );
      }

      self.cycle();
    },

    attachStyle: function() {
      var self = this,
        styles = [],
        $style;
      // Only add the style if it doesn't already exist
      if ($('#flexo-style').length === 0) {
        styles.push( '.flexo-container  .flexo-image { cursor: pointer; float: left; overflow: hidden; margin: ' + self.options.style.margin + 'px; padding: 0; line-height: 0; background-color: rgba(0,0,0,0.2); }' );
        styles.push( '.flexo-container .flexo-image img { marign: 0; padding: 0; }' );
        styles.push( '.flexo-container:after { content: "."; visibility: hidden; display: block; height: 0; clear:both; }' );
        styles.push( '.flexo-container .flexo-image:hover {   -webkit-box-shadow: ' + self.options.style.outline + ' 0px 0px 6px 2px; -moz-box-shadow: ' + self.options.style.outline + ' 0px 0px 6px 2px; box-shadow: ' + self.options.style.outline + ' 0px 0px 6px 2px; -webkit-transition: -webkit-box-shadow 0.3s ease-in-out; -moz-transition: -moz-box-shadow 0.3s ease-in-out; transition: box-shadow 0.3s ease-in-out; }');
        self.$element.addClass( 'flexo-container' );
        $style = $( '<style></style>', {
          type: 'text/css',
          id: 'flexo-style'
        }).text( styles.join( '' ) );
        $('body').append( $style );
      }

      // remove container width
      self.$element.css({
        width: '100%'
      });
      // set container width
      self.$element.css({
        width: self.$element.width()
      });
    },

    // Control the flow of execution
    cycle: function() {
      var self = this;
      if ( self.options.resize ) {
        self.bindResize();
      }
      self.attachStyle();
      self.build( self.originalImages );
      self.display();
    },

    bindResize: function() {
      var self = this,
          resized = false,
          timer,
          $window = $(window),
          width = $window.width();

      // attach to the window
      $( window ).resize(function ( event ) {
        if ( timer !== false ) {
          clearTimeout( timer );
          timer = setTimeout(function () {
            if(width !== $window.width()) {
              self.attachStyle();
              self.build( self.originalImages );
              self.display( false );
              width = $window.width();
            }
          }, 250);
        }
      });
    },

    // Builds the image HTML
    build: function( results ) {
      var self = this,
          maxWidth = self.$element.width(),
          currentWidth = 0,
          imageStack = [],
          minHeight = Infinity,
          i = 0;


      // Calculates the number of pixels to reduce each image by
      // based on number of images and image width
      function calculateWidthReductions( images, overlap ) {
        var reductions   = [],
            totalWidth   = 0,
            totalReduced = 0,
            i = 0,
            numImages = images.length;

        for ( ; i < numImages; i++ ) {
          totalWidth += images[i].width;
        }

        for ( i = 0; i < numImages; i++ ) {
          var fraction = images[i].width / totalWidth;
          reductions[i] = Math.floor( fraction * overlap );
          totalReduced += reductions[i];
        }

        var pixelsRemaining = overlap - totalReduced;
        while ( pixelsRemaining > 0 ) {
          for ( i = 0; i < numImages; i++ ) {
            reductions[i] += 1;
            pixelsRemaining -= 1;
            if ( pixelsRemaining === 0 ) {
              break;
            }
          }
        }
        return reductions;
      }

      // function that processes a set of images
      function processRow( images, overlap, minHeight ) {
        var numImages = images.length,
            reduction = Math.floor( overlap / numImages ),
            additionalPixels = overlap % numImages,
            reductions = calculateWidthReductions( images, overlap ),
            i = 0;

        // Limit the height if the option has been passed
        if ( self.options.maxHeight ) {
          minHeight = Math.min( minHeight, self.options.maxHeight );
        }


        for ( ; i < numImages; i++ ) {
          var res = images[i],
              $container = $('<div></div>', {
                'class': 'flexo-image',
                width: res.width - reductions[i],
                height: minHeight
              }).append($('<img />', {
                src: res.url
              }).css({
                width: res.width,
                height: res.height,
                'margin-left': -(Math.floor(reductions[i] / 2)),
                'margin-top': -(res.height - minHeight) / 2
              }));
          // stick it on the HTML stack
          self.processedImages.push($container);
        }
      }


      self.processedImages = [];

      for ( ; i < results.length; i++ ) {
        var res = results[i];

        if ( res.height > self.options.maxHeight ) {
          res.width = Math.floor(self.options.maxHeight / res.height * res.width);
          res.height = self.options.maxHeight;
        }

        var width = res.width;

        imageStack.push( res );
        currentWidth += width + self.options.style.margin * 2;
        if ( res.height < minHeight ) {
          minHeight = res.height;
        }
        if ( currentWidth >= maxWidth ) {
          processRow( imageStack, currentWidth - maxWidth, minHeight );
          imageStack.length = 0;
          currentWidth = 0;
          minHeight = Infinity;
        }
      }

      // Process the remaining images with zero overlap
      processRow( imageStack, 0, minHeight );
    },

    display: function( append ) {
      var self = this;
      append = append === undefined ? self.options.append || true : append,
      attachElements = function() {
        for ( var i = 0; i < self.processedImages.length; i++ ) {
          self.$element.append( self.processedImages[i] );
        }
        self.$element.fadeIn(100);
      };

      if ( !append ) {
        self.$element.fadeOut(100, function () {
          self.$element.empty();
          attachElements();
        });
      } else {
        attachElements();
      }


    }
  };

  $.fn.flexo = function ( options ) {
    return this.each(function () {
      var flexo = Object.create( Flexo );
      flexo.init( options, this );
    });
  };

  $.fn.flexo.options = {
    maxHeight: 240,
    resize: true,
    append: true,
    style: {
      outline: '#1C88A8',
      margin: 3
    }
  };

}( jQuery, window, document ));