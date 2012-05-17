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
        styles.push( '.flexo-container  .flexo-image { float: left; overflow: hidden; margin: ' + self.options.margin + 'px; padding: 0; line-height: 0; }' );
        styles.push( '.flexo-container .flexo-image img { marign: 0; padding: 0; }' );
        styles.push( '.flexo-container:after { content: "."; visibility: hidden; display: block; height: 0; clear:both; }' );
        styles.push( '.flexo-container .flexo-image:hover { cursor: pointer; }');
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
          minHeight = Infinity;


      // Calculates the number of pixels to reduce each image by
      // based on number of images and image width
      function calculateWidthReductions( images, overlap ) {
        var reductions   = [],
            totalWidth   = 0,
            totalReduced = 0;

        for (var i = 0; i < images.length; i++) {
          totalWidth += images[i].width;
        }

        for (var j = 0; j < images.length; j++) {
          var fraction = images[j].width / totalWidth;
          reductions[j] = Math.floor( fraction * overlap );
          totalReduced += reductions[j];
        }

        var pixelsRemaining = overlap - totalReduced;
        while ( pixelsRemaining > 0 ) {
          for (var k = 0; k < reductions.length; k++) {
            reductions[k] += 1;
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
            reductions = calculateWidthReductions( images, overlap );

        // Limit the height if the option has been passed
        if ( self.options.maxHeight ) {
          minHeight = Math.min( minHeight, self.options.maxHeight );
        }


        for (var i = 0; i < numImages; i++) {
          var res = images[i],
              $container = $('<div></div>', {
                'class': 'flexo-image',
                width: res.width - reductions[i],
                height: minHeight
              }).append($('<img />', {
                src: res.url
              }).css({
                'margin-left': -(Math.floor(reductions[i] / 2)),
                'margin-top': -(res.height - minHeight) / 2
              }));
          // stick it on the HTML stack
          self.processedImages.push($container);
        }
      }


      self.processedImages = [];

      for (var i = 0; i < results.length; i++) {
        var res = results[i],
            width = res.width;

        imageStack.push( res );
        currentWidth += width + self.options.margin * 2;
        if ( res.height < minHeight ) {
          minHeight = res.height;
        }
        if (currentWidth >= maxWidth ) {
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
    margin: 3,
    maxHeight: false,
    resize: true,
    append: true
  };

}( jQuery, window, document ));