  $(function () {

    var SliderModule = (function () {
      var pb = {};
      pb.el = $('#slider');
      pb.items = {
        panels: pb.el.find('.slider-wrapper > li'),
      }

      // Interval del Slider
      var SliderInterval,
        currentSlider = 0,
        nextSlider = 1,
        lengthSlider = pb.items.panels.length;

      // Constructor del Slider
      pb.init = function (settings) {
        this.settings = settings || {
          duration: 8000
        };
        var items = this.items,
          lengthPanels = items.panels.length,
          output = '';

        // Insertamos nuestros botones
        for (var i = 0; i < lengthPanels; i++) {
          if (i == 0) {
            output += '<li class="active">Slide 0' + parseInt(i + 1) + '</li>';
          } else {
            output += '<li>Slide 0' + parseInt(i + 1) + '</li>';
          }
        }

        $('#control-buttons').html(output);

        // Activamos nuestro Slider
        activateSlider();
        // Eventos para los controles
        $('#control-buttons').on('click', 'li', function (e) {
          var $this = $(this);
          if (!(currentSlider === $this.index())) {
            changePanel($this.index());
          }
        });

      }

      // Funcion para activar el Slider
      var activateSlider = function () {
        SliderInterval = setInterval(pb.startSlider, pb.settings.duration);
      }

      // Funcion para la Animacion
      pb.startSlider = function () {
        var items = pb.items,
          controls = $('#control-buttons li');
        // Comprobamos si es el ultimo panel para reiniciar el conteo
        if (nextSlider >= lengthSlider) {
          nextSlider = 0;
          currentSlider = lengthSlider - 1;
        }

        controls.removeClass('active').eq(nextSlider).addClass('active');
        items.panels.eq(currentSlider).fadeOut('slow');
        items.panels.eq(nextSlider).fadeIn('slow');

        // Actualizamos los datos del slider
        currentSlider = nextSlider;
        nextSlider += 1;
      }

      // Funcion para Cambiar de Panel con Los Controles
      var changePanel = function (id) {
        clearInterval(SliderInterval);
        var items = pb.items,
          controls = $('#control-buttons li');
        // Comprobamos si el ID esta disponible entre los paneles
        if (id >= lengthSlider) {
          id = 0;
        } else if (id < 0) {
          id = lengthSlider - 1;
        }

        controls.removeClass('active').eq(id).addClass('active');
        items.panels.eq(currentSlider).fadeOut('slow');
        items.panels.eq(id).fadeIn('slow');

        // Volvemos a actualizar los datos del slider
        currentSlider = id;
        nextSlider = id + 1;
        // Reactivamos nuestro slider
        activateSlider();
      }

      return pb;
    }());

    SliderModule.init({
      duration: 7000
    });

    // End Slider
    // Start Parallax

    /* detect touch */
    if ('ontouchstart' in window) {
      document.documentElement.className = document.documentElement.className + ' touch';
    }
    if (!$('html').hasClass('touch')) {
      /* background fix */
      $('.parallax').css('background-attachment', 'fixed');
    }

    /* resize background images */
    function backgroundResize() {
      var windowH = $(window).height();
      $('.background').each(function (i) {
        var path = $(this);
        // variables
        var contW = path.width();
        var contH = path.height();
        var imgW = path.attr('data-img-width');
        var imgH = path.attr('data-img-height');
        var ratio = imgW / imgH;
        // overflowing difference
        var diff = parseFloat(path.attr('data-diff'));
        diff = diff ? diff : 0;
        // remaining height to have fullscreen image only on parallax
        var remainingH = 0;
        if (path.hasClass('parallax') && !$('html').hasClass('touch')) {
          var maxH = contH > windowH ? contH : windowH;
          remainingH = windowH - contH;
        }
        // set img values depending on cont
        imgH = contH + remainingH + diff;
        imgW = imgH * ratio;
        // fix when too large
        if (contW > imgW) {
          imgW = contW;
          imgH = imgW / ratio;
        }
        //
        path.data('resized-imgW', imgW);
        path.data('resized-imgH', imgH);
        path.css('background-size', imgW + 'px ' + imgH + 'px');
      });
    }
    $(window).resize(backgroundResize);
    $(window).focus(backgroundResize);
    backgroundResize();

    /* set parallax background-position */
    function parallaxPosition(e) {
      var heightWindow = $(window).height();
      var topWindow = $(window).scrollTop();
      var bottomWindow = topWindow + heightWindow;
      var currentWindow = (topWindow + bottomWindow) / 2;
      $('.parallax').each(function (i) {
        var path = $(this);
        var height = path.height();
        var top = path.offset().top;
        var bottom = top + height;
        // only when in range
        if (bottomWindow > top && topWindow < bottom) {
          var imgW = path.data('resized-imgW');
          var imgH = path.data('resized-imgH');
          // min when image touch top of window
          var min = 0;
          // max when image touch bottom of window
          var max = -imgH + heightWindow;
          // overflow changes parallax
          var overflowH = height < heightWindow ? imgH - height : imgH - heightWindow; // fix height on overflow
          top = top - overflowH;
          bottom = bottom + overflowH;
          // value with linear interpolation
          var value = min + (max - min) * (currentWindow - top) / (bottom - top);
          // set background-position
          var orizontalPosition = path.attr('data-oriz-pos');
          orizontalPosition = orizontalPosition ? orizontalPosition : '50%';
          $(this).css('background-position', orizontalPosition + ' ' + value + 'px');
        }
      });
    }
    if (!$('html').hasClass('touch')) {
      $(window).resize(parallaxPosition);
      //$(window).focus(parallaxPosition);
      $(window).scroll(parallaxPosition);
      parallaxPosition();
    }

    /*
Reference: http://jsfiddle.net/BB3JK/47/
*/

    $('select').each(function () {
      var $this = $(this),
        numberOfOptions = $(this).children('option').length;

      $this.addClass('select-hidden');
      $this.wrap('<div class="select"></div>');
      $this.after('<div class="select-styled"></div>');

      var $styledSelect = $this.next('div.select-styled');
      $styledSelect.text($this.children('option').eq(0).text());

      var $list = $('<ul />', {
        'class': 'select-options'
      }).insertAfter($styledSelect);

      for (var i = 0; i < numberOfOptions; i++) {
        $('<li />', {
          text: $this.children('option').eq(i).text(),
          rel: $this.children('option').eq(i).val()
        }).appendTo($list);
      }

      var $listItems = $list.children('li');

      $styledSelect.click(function (e) {
        e.stopPropagation();
        $('div.select-styled.active').not(this).each(function () {
          $(this).removeClass('active').next('ul.select-options').hide();
        });
        $(this).toggleClass('active').next('ul.select-options').toggle();
      });

      $listItems.click(function (e) {
        e.stopPropagation();
        $styledSelect.text($(this).text()).removeClass('active');
        $this.val($(this).attr('rel'));
        $list.hide();
        //console.log($this.val());
      });

      $(document).click(function () {
        $styledSelect.removeClass('active');
        $list.hide();
      });

    });

  });
