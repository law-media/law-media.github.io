window.theme = window.theme || {};

/* ================ SLATE ================ */
window.theme = window.theme || {};

theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));

  // Global sections event listeners
  // Section select
  $(document).on('shopify:section:select', function(evt) {
    if (evt.detail.sectionId !== 'sidebar-menu') {
      theme.LeftDrawer.close();
    }
  });
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (_.isUndefined(constructor)) return;

    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
  },

  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance) {
      var isEventInstance = instance.id === evt.detail.sectionId;

      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(
      function(index, container) {
        this._createInstance(container, constructor);
      }.bind(this)
    );
  }
});


/* ================ MODULES ================ */
window.a11y = window.a11y || {};

a11y.trapFocus = function($container, eventNamespace) {
  var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

  $container.attr('tabindex', '-1').focus();

  $(document).on(eventName, function(evt) {
    if ($container[0] !== evt.target && !$container.has(evt.target).length) {
      $container.focus();
    }
  });
};

a11y.removeTrapFocus = function($container, eventNamespace) {
  var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

  $container.removeAttr('tabindex');
  $(document).off(eventName);
};

window.Modals = (function() {
  var Modal = function(id, name, options) {
    var defaults = {
      close: '.js-modal-close',
      open: '.js-modal-open-' + name,
      openClass: 'modal--is-active'
    };

    this.$modal = $('#' + id);

    if (!this.$modal.length) {
      return false;
    }

    this.nodes = {
      $parent: $('body, html')
    };
    this.config = $.extend(defaults, options);
    this.modalIsOpen = false;
    this.$focusOnOpen = this.config.$focusOnOpen
      ? $(this.config.$focusOnOpen)
      : this.$modal;
    this.init();
  };

  Modal.prototype.init = function() {
    var $openBtn = $(this.config.open);

    // Add aria controls
    $openBtn.attr('aria-expanded', 'false');

    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$modal.find(this.config.close).on('click', $.proxy(this.close, this));
  };

  Modal.prototype.open = function(evt) {
    // Keep track if modal was opened from a click, or called by another function
    var externalCall = false;

    // don't open an opened modal
    if (this.modalIsOpen) return;

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the modal opens, the click event bubbles up to $nodes.page
    // which closes the modal.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.modalIsOpen && !externalCall) {
      return this.close();
    }

    this.$modal.prepareTransition().addClass(this.config.openClass);
    this.nodes.$parent.addClass(this.config.openClass);

    this.modalIsOpen = true;

    // Set focus on modal
    a11y.trapFocus(this.$focusOnOpen, 'modal_focus');

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    this.bindEvents();
  };

  Modal.prototype.close = function() {
    // don't close a closed modal
    if (!this.modalIsOpen) return;

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    this.$modal.prepareTransition().removeClass(this.config.openClass);
    this.nodes.$parent.removeClass(this.config.openClass);

    this.modalIsOpen = false;

    // Remove focus on modal
    a11y.removeTrapFocus(this.$focusOnOpen, 'modal_focus');

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'false');
    }

    this.unbindEvents();
  };

  Modal.prototype.bindEvents = function() {
    // Pressing escape closes modal
    this.nodes.$parent.on(
      'keyup.modal',
      $.proxy(function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }, this)
    );
  };

  Modal.prototype.unbindEvents = function() {
    this.nodes.$parent.off('.modal');
  };

  return Modal;
})();

/**
 *  Vendor
 *
 *  Small minified vendor scripts can be placed at the top of this file to
 *  reduce network requests.
 *
 */

/**
 *
 *  ShopifyCanvas JS
 *  - Base Canvas functions and utilities.
 *
 */

window.ShopifyCanvas = window.ShopifyCanvas || {};

/**
 *
 *  Initialize function for all ShopifyCanvas JS.
 *  - call any functions required on page load here.
 *
 */
ShopifyCanvas.init = function() {
  ShopifyCanvas.cacheSelectors();
  ShopifyCanvas.checkUrlHash();
  ShopifyCanvas.initEventListeners();
  ShopifyCanvas.resetPasswordSuccess();
  ShopifyCanvas.customerAddressForm();
};

/**
 *
 *  Cache any jQuery objects.
 *
 */
ShopifyCanvas.cacheSelectors = function() {
  ShopifyCanvas.cache = {
    $html: $('html'),
    $body: $('body')
  };
};

ShopifyCanvas.initEventListeners = function() {
  //Show reset password form
  $('#RecoverPassword').on('click', function(evt) {
    evt.preventDefault();
    ShopifyCanvas.toggleRecoverPasswordForm();
  });

  //Hide reset password form
  $('#HideRecoverPasswordLink').on('click', function(evt) {
    evt.preventDefault();
    ShopifyCanvas.toggleRecoverPasswordForm();
  });
};

/**
 *
 *  Show/Hide recover password form
 *
 */
ShopifyCanvas.toggleRecoverPasswordForm = function() {
  $('#RecoverPasswordForm').toggleClass('hide');
  $('#CustomerLoginForm').toggleClass('hide');
};

/**
 *
 *  Show reset password success message
 *
 */
ShopifyCanvas.resetPasswordSuccess = function() {
  var $formState = $('.reset-password-success');

  //check if reset password form was successfully submited.
  if (!$formState.length) return;

  // show success message
  $('#ResetSuccess').removeClass('hide');
};

/**
 *
 *  Show/hide customer address forms
 *
 */
ShopifyCanvas.customerAddressForm = function() {
  var $newAddressForm = $('#AddressNewForm');

  if (!$newAddressForm.length) return;

  // Initialize observers on address selectors, defined in shopify_common.js
  new Shopify.CountryProvinceSelector(
    'AddressCountryNew',
    'AddressProvinceNew',
    {
      hideElement: 'AddressProvinceContainerNew'
    }
  );

  // Initialize each edit form's country/province selector
  $('.address-country-option').each(function() {
    var formId = $(this).data('form-id');
    var countrySelector = 'AddressCountry_' + formId;
    var provinceSelector = 'AddressProvince_' + formId;
    var containerSelector = 'AddressProvinceContainer_' + formId;

    new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
      hideElement: containerSelector
    });
  });

  // Toggle new/edit address forms
  $('.address-new-toggle').on('click', function() {
    $newAddressForm.toggleClass('hide');
  });

  $('.address-edit-toggle').on('click', function() {
    var formId = $(this).data('form-id');
    $('#EditAddress_' + formId).toggleClass('hide');
  });

  $('.address-delete').on('click', function() {
    var $el = $(this);
    var formId = $el.data('form-id');
    var confirmMessage = $el.data('confirm-message');
    if (
      confirm(confirmMessage || 'Are you sure you wish to delete this address?')
    ) {
      Shopify.postLink('/account/addresses/' + formId, {
        parameters: { _method: 'delete' }
      });
    }
  });
};

/**
 *
 *  Check URL for reset password hash
 *
 */
ShopifyCanvas.checkUrlHash = function() {
  var hash = ShopifyCanvas.getHash();

  // Allow deep linking to recover password form
  if (hash === '#recover') {
    ShopifyCanvas.toggleRecoverPasswordForm();
  }
};

/**
 *
 *  Get the hash from the URL
 *
 */
ShopifyCanvas.getHash = function() {
  return window.location.hash;
};

// Initialize ShopifyCanvas's JS on docready
$(ShopifyCanvas.init);

/*
 * Returns a function which adds a vendor prefix to any CSS property name
 * Source https://github.com/markdalgleish/stellar.js/blob/master/src/jquery.stellar.js
 */

var vendorPrefix = (function() {
  var prefixes = /^(Moz|Webkit|O|ms)(?=[A-Z])/,
    style = $('script')[0].style,
    prefix = '',
    prop;

  for (prop in style) {
    if (prefixes.test(prop)) {
      prefix = prop.match(prefixes)[0];
      break;
    }
  }

  if ('WebkitOpacity' in style) {
    prefix = 'Webkit';
  }
  if ('KhtmlOpacity' in style) {
    prefix = 'Khtml';
  }

  return function(property) {
    return (
      prefix +
      (prefix.length > 0
        ? property.charAt(0).toUpperCase() + property.slice(1)
        : property)
    );
  };
})();

/*
 * Shopify JS for customizing Slick.js
 *   http://kenwheeler.github.io/slick/
 *   Untouched JS in src/javascripts/slick.min.js (dev)
 *   Added to the top of this file in production

 * Requires $.debounce function from theme.js
 */

var slickTheme = (function(module, $) {
  'use strict';

  // Public functions
  var init, onInit, beforeChange, afterChange;

  // Private variables
  var settings,
    $slider,
    $allSlides,
    $activeSlide,
    $slickDots,
    $paginations,
    $mobileDotsContainer,
    windowHeight,
    scrolled,
    prefixedTransform;
  var currentActiveSlide = 0;

  // Private functions
  var cacheObjects,
    setFullScreen,
    setPaginationAttributes,
    adaptHeight,
    showActiveContent,
    keyboardNavigation,
    togglePause,
    sizeFullScreen,
    setParallax,
    calculateParallax,
    slideshowA11ySetup;

  /*============================================================================
  Initialise the plugin and define global options
  ==============================================================================*/
  cacheObjects = function() {
    slickTheme.cache = {
      $html: $('html'),
      $window: $(window),
      $hero: $('#Hero'),
      $heroImage: $('.hero__image'),
      $pauseButton: $('.hero__pause'),
      $heroDotsWrapper: $('.hero__dots-wrapper'),
      $heroDotsWrapperDesktop: $('.hero__dots-wrapper-desktop'),
      $heroContentWrapperMobile: $('.hero__content-wrapper-mobile'),
      $heroHeader: $('.hero__header')
    };

    slickTheme.vars = {
      slideClass: 'slick-slide',
      activeClass: 'slick-active',
      slickList: '.slick-list',
      slickDots: '.slick-dots',
      slickActiveMobile: 'slick-active-mobile',
      hiddenClass: 'hero__slide--hidden',
      pausedClass: 'is-paused',
      activeContentClass: 'is-active',
      pagination: '[data-slide-pagination]',
      adapt: slickTheme.cache.$hero.data('adapt'),
      loadSlideA11yString: slickTheme.cache.$hero.data('slide-nav-a11y'),
      activeSlideA11yString: slickTheme.cache.$hero.data(
        'slide-nav-active-a11y'
      )
    };
  };

  init = function(options) {
    cacheObjects();

    // Default settings
    settings = {
      // User options
      $element: null,

      // Private settings
      isTouch: slickTheme.cache.$html.hasClass('supports-touch') ? true : false,

      // Slick options
      arrows: false,
      dots: true,
      adaptiveHeight: false
    };

    // Override defaults with arguments
    $.extend(settings, options);

    /*
    * Init slick slider
    *   - Add any additional option changes here
    *   - https://github.com/kenwheeler/slick/#options
    */
    settings.$element.slick({
      arrows: settings.arrows,
      dots: settings.dots,
      draggable: false,
      fade: true,
      slide: '.hero__slide',
      /*eslint-disable shopify/jquery-dollar-sign-reference */
      prevArrow: $('.slick-prev'),
      nextArrow: $('.slick-next'),
      appendDots: $('.hero__dots-wrapper'),
      /*eslint-enable shopify/jquery-dollar-sign-reference */
      autoplay: slickTheme.cache.$hero.data('autoplay'),
      autoplaySpeed: slickTheme.cache.$hero.data('autoplayspeed'),
      speed: settings.speed,
      pauseOnHover: false,
      onInit: this.onInit,
      onBeforeChange: this.beforeChange,
      onAfterChange: this.afterChange,
      customPaging: function(slick, index) {
        var labelString =
          index === 0
            ? slickTheme.vars.activeSlideA11yString
            : slickTheme.vars.loadSlideA11yString;
        return (
          '<a href="#Hero" class="hero__dots" aria-label="' +
          labelString.replace('[slide_number]', index + 1) +
          '" data-slide-number="' +
          index +
          '" data-slide-pagination aria-controls="SlickSlide' +
          (index + 1) +
          '"></a>'
        );
      }
    });
  };

  onInit = function(obj) {
    $slider = obj.$slider;
    $allSlides = $slider.find('.' + slickTheme.vars.slideClass);
    $activeSlide = $slider.find('.' + slickTheme.vars.activeClass);
    $slickDots = $(slickTheme.vars.slickDots);
    $paginations = slickTheme.cache.$heroDotsWrapper.find(
      slickTheme.vars.pagination
    );
    $mobileDotsContainer = slickTheme.cache.$heroContentWrapperMobile.find(
      slickTheme.vars.slickDots
    );

    if (!settings.isTouch) {
      $allSlides.addClass(slickTheme.vars.hiddenClass);
      $activeSlide.removeClass(slickTheme.vars.hiddenClass);
    }

    if (slickTheme.vars.adapt) {
      adaptHeight();
      showActiveContent(0);
    } else {
      setFullScreen();
    }

    if (slickTheme.cache.$html.hasClass('supports-csstransforms3d')) {
      setParallax();
    }

    //trigger event that slick has initialized
    slickTheme.cache.$window.trigger('slick-initialized');

    if (settings.autoplay) {
      slickTheme.cache.$pauseButton.on('click', togglePause);
    }

    slideshowA11ySetup();
  };

  beforeChange = function(evt, currentSlide, nextSlide) {
    if (!settings.isTouch) {
      $allSlides.removeClass(slickTheme.vars.hiddenClass);
    }

    // Set upcoming slide as index
    currentActiveSlide = nextSlide;

    // Set new active slide to proper parallax position
    if (slickTheme.cache.$html.hasClass('supports-csstransforms3d')) {
      calculateParallax(currentActiveSlide);
    }

    var $desktopPagination = slickTheme.cache.$heroDotsWrapperDesktop.find(
      slickTheme.vars.pagination
    );

    var $mobilePagination = slickTheme.cache.$heroContentWrapperMobile.find(
      slickTheme.vars.pagination
    );

    // initialize both $desktopPagination and $mobilePagination
    // at the same time
    $desktopPagination.each(function(index) {
      var currentElem = this;
      setPaginationAttributes(currentElem, index, nextSlide);
    });

    $mobilePagination.each(function(index) {
      var currentElem = this;
      setPaginationAttributes(currentElem, index, nextSlide);
    });

    $paginations
      .removeAttr('aria-current', 'true')
      .eq(nextSlide)
      .attr('aria-current', 'true');

    if (!slickTheme.vars.adapt || !$mobileDotsContainer.length) {
      return;
    }

    var $mobileDotsList = $mobileDotsContainer.find('li');

    showActiveContent(nextSlide);

    // toggle active class on mobile dots
    $mobileDotsList
      .removeAttr('aria-hidden')
      .removeClass(slickTheme.vars.slickActiveMobile)
      .eq(nextSlide)
      .addClass(slickTheme.vars.slickActiveMobile)
      .attr('aria-hidden', false);
  };

  afterChange = function() {
    var $dotsList = $slickDots.find('li');
    var $activeDot = $slickDots.find('.' + slickTheme.vars.activeClass);

    $dotsList.removeAttr('aria-hidden');
    $activeDot.attr('aria-hidden', false);

    if (settings.isTouch) return;

    $activeSlide = $slider.find('.' + slickTheme.vars.activeClass);
    $allSlides.addClass(slickTheme.vars.hiddenClass).attr('aria-hidden', true);
    $activeSlide
      .removeClass(slickTheme.vars.hiddenClass)
      .attr('aria-hidden', false);
  };

  setPaginationAttributes = function(currentElem, index, nextSlide) {
    var labelString =
      index === nextSlide
        ? slickTheme.vars.activeSlideA11yString
        : slickTheme.vars.loadSlideA11yString;

    labelString = labelString.replace('[slide_number]', index + 1);
    $(currentElem).attr('aria-label', labelString);
  };

  adaptHeight = function() {
    // Set class on action bar
    slickTheme.cache.$heroHeader.addClass('hero__header--adapt');

    // set custom dot class for adapt height on mobile
    if (!$mobileDotsContainer.length) {
      return;
    }

    var $initialActiveDot = $mobileDotsContainer.find('li:first-of-type');
    $initialActiveDot.addClass(slickTheme.vars.slickActiveMobile);
  };

  setFullScreen = function() {
    sizeFullScreen();

    // Resize hero after screen resize
    slickTheme.cache.$window.on('resize', $.debounce(250, sizeFullScreen));
  };

  showActiveContent = function(slideIndex) {
    if ($allSlides.length <= 1) return;

    var $contentMobile = $('.hero__content-mobile');

    if (!$contentMobile.length) {
      return;
    }

    var $currentContentMobile = $contentMobile.filter(
      '[data-index="' + (slideIndex + 1) + '"]'
    );

    $contentMobile.removeClass(slickTheme.vars.activeContentClass);
    $currentContentMobile.addClass(slickTheme.vars.activeContentClass);
  };

  keyboardNavigation = function(evt) {
    if (evt.keyCode === 37) {
      settings.$element.slickPrev();
    }
    if (evt.keyCode === 39) {
      settings.$element.slickNext();
    }
  };

  togglePause = function() {
    var $pauseButton = $(this);
    var isPaused = $pauseButton.hasClass(slickTheme.vars.pausedClass);

    $pauseButton
      .toggleClass(slickTheme.vars.pausedClass, !isPaused)
      .attr(
        'aria-label',
        isPaused
          ? $pauseButton.data('label-pause')
          : $pauseButton.data('label-play')
      );

    if (settings.autoplay) {
      if (isPaused) {
        settings.$element.slickPlay();
      } else {
        settings.$element.slickPause();
      }
    }
  };

  sizeFullScreen = function() {
    if (theme.cache.$announcementBar.length) {
      windowHeight =
        slickTheme.cache.$window.height() -
        theme.cache.$announcementBar.height();
    } else {
      windowHeight = slickTheme.cache.$window.height();
    }

    settings.$element.css('height', windowHeight);
  };

  setParallax = function() {
    prefixedTransform = vendorPrefix ? vendorPrefix('transform') : 'transform';

    slickTheme.cache.$window.on('scroll', function() {
      calculateParallax(currentActiveSlide);
    });
  };

  calculateParallax = function(currentSlide) {
    scrolled = slickTheme.cache.$window.scrollTop();

    if (slickTheme.cache.$heroImage[currentSlide]) {
      slickTheme.cache.$heroImage[currentSlide].style[prefixedTransform] =
        'translate3d(0, ' + scrolled / 4.5 + 'px, 0)';
    }

    if (theme.cache.$announcementBar.length) {
      $(theme.cache.$announcementBar).css({
        transform: 'translate3d(0, ' + scrolled / 4.5 + 'px, 0)'
      });
    }
  };

  slideshowA11ySetup = function() {
    var $list = slickTheme.cache.$hero.find(slickTheme.vars.slickList);
    var $dotsList = $slickDots.find('li');
    var $activeDot = $slickDots.find('.' + slickTheme.vars.activeClass);
    var $mobileActiveDot = $slickDots.find(
      '.' + slickTheme.vars.slickActiveMobile
    );
    // When an element in the slider is focused
    // pause slideshow and set active slide aria-live.
    slickTheme.cache.$hero
      .on('focusin', function(evt) {
        if (
          !slickTheme.cache.$hero.has(evt.target).length ||
          $list.attr('aria-live') === 'polite'
        ) {
          return;
        }

        $list.attr('aria-live', 'polite');
        if (settings.autoplay) {
          settings.$element.slickPause();
        }
      })
      .on('focusout', function(evt) {
        if (slickTheme.cache.$hero.has(evt.relatedTarget).length) {
          return;
        }

        $list.removeAttr('aria-live');
        if (settings.autoplay) {
          // Only resume playing if the user hasn't paused using the pause
          // button
          if (
            !slickTheme.cache.$pauseButton.hasClass(slickTheme.vars.pausedClass)
          ) {
            settings.$element.slickPlay();
          }
        }
      })
      .on('keyup', keyboardNavigation.bind(this));

    $list.removeAttr('tabindex');
    $dotsList.removeAttr('aria-hidden');
    $activeDot.attr('aria-hidden', false);
    $mobileActiveDot.attr('aria-hidden', false);

    if ($allSlides.length > 1) {
      $paginations
        .each(function() {
          $(this).on('click keyup', function(evt) {
            if (evt.type === 'keyup' && evt.which !== 13) return;

            evt.preventDefault();

            slickTheme.cache.$hero.attr('tabindex', -1);

            if (evt.type === 'keyup') {
              slickTheme.cache.$hero.focus();
            }
          });
        })
        .eq(0)
        .attr('aria-current', 'true');
    }
  };

  module = {
    init: init,
    onInit: onInit,
    beforeChange: beforeChange,
    afterChange: afterChange
  };

  return module;
})(slickTheme || {}, jQuery);

/*============================================================================
  Drawer modules
==============================================================================*/
theme.Drawers = (function() {
  var Drawer = function(id, position, options) {
    var defaults = {
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + position,
      openClass: 'js-drawer-open',
      dirOpenClass: 'js-drawer-open-' + position
    };

    this.nodes = {
      $parent: $('body, html'),
      $page: $('#PageContainer')
    };

    this.config = $.extend(defaults, options);
    this.position = position;

    this.$drawer = $('#' + id);

    if (!this.$drawer.length) {
      return false;
    }

    this.drawerIsOpen = false;
    this.init();
  };

  Drawer.prototype.init = function() {
    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$drawer.on('click', this.config.close, $.proxy(this.close, this));
  };

  Drawer.prototype.open = function(evt) {
    // Keep track if drawer was opened from a click, or called by another function
    var externalCall = false;

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the drawer opens, the click event bubbles up to $nodes.page
    // which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    // Add is-transitioning class to moved elements on open so drawer can have
    // transition for close animation
    this.$drawer.prepareTransition();

    this.nodes.$parent.addClass(
      this.config.openClass + ' ' + this.config.dirOpenClass
    );
    this.drawerIsOpen = true;

    // Set focus on drawer
    this.trapFocus({
      $container: this.$drawer,
      $elementToFocus: this.$drawer.find('.drawer__close-button'),
      namespace: 'drawer_focus'
    });

    // Run function when draw opens if set
    if (
      this.config.onDrawerOpen &&
      typeof this.config.onDrawerOpen === 'function'
    ) {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    this.nodes.$parent.on(
      'keyup.drawer',
      $.proxy(function(evt) {
        // close on 'esc' keypress
        if (evt.keyCode !== 27) return;

        this.close();
      }, this)
    );

    // Lock scrolling on mobile
    this.nodes.$page.on('touchmove.drawer', function() {
      return false;
    });

    this.nodes.$page.on(
      'click.drawer',
      $.proxy(function() {
        this.close();
        return false;
      }, this)
    );
  };

  Drawer.prototype.close = function() {
    if (!this.drawerIsOpen) return;

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    // Ensure closing transition is applied to moved elements, like the nav
    this.$drawer.prepareTransition();

    this.nodes.$parent.removeClass(
      this.config.dirOpenClass + ' ' + this.config.openClass
    );

    this.drawerIsOpen = false;

    // Remove focus on drawer
    this.removeTrapFocus({
      $container: this.$drawer,
      namespace: 'drawer_focus'
    });

    this.nodes.$page.off('.drawer');
    this.nodes.$parent.off('.drawer');
  };

  /**
  * Traps the focus in a particular container
  *
  * @param {object} options - Options to be used
  * @param {jQuery} options.$container - Container to trap focus within
  * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
  * @param {string} options.namespace - Namespace used for new focus event handler
  */
  Drawer.prototype.trapFocus = function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).on(eventName, function(evt) {
      if (
        options.$container[0] !== evt.target &&
        !options.$container.has(evt.target).length
      ) {
        options.$container.focus();
      }
    });
  };

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  Drawer.prototype.removeTrapFocus = function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  };

  return Drawer;
})();

theme.ActionBar = (function() {
  function init() {
    cacheSelectors();
    initStickyActionBar();
    initActionBar();

    theme.cache.$window.on('resize', $.debounce(250, resizeEvents));
  }

  function cacheSelectors() {
    var cache = {
      $actionBar: $('.action-bar'),
      $actionArea: $('.action-area'),
      $actionBarWrapper: $('.action-bar-wrapper'),
      $actionBarMenus: $('.action-bar__menu'),
      $actionBarMenuHasDropdown: $('.action-bar--has-dropdown'),
      $activeActionBarHasSubMenu: $(
        '.action-bar--has-dropdown.action-bar--active'
      ),
      $actionBarMainMenu: $('.action-bar__menu--main'),
      $actionBarSubMenus: $('.action-bar__menu--sub'),
      $actionBarBack: $('.action-bar__back'),
      $actionBarMainMenuFirst: $(
        '.action-bar__menu--main .action-bar__link'
      ).eq(0)
    };

    $.extend(theme.cache, cache);

    var variables = {
      previousScrollPosition: 0,
      hasActionBar: theme.cache.$actionBar.length,
      actionBarOffsetTop: 0,
      actionBarOffsetBottom: 0,
      stickyClass: 'js-sticky-action-bar',
      actionBarOpenTransitionClass: 'js-sticky-action-bar--open'
    };

    $.extend(theme.variables, variables);
  }

  function initActionBar() {
    actionBarScroll();

    if (theme.cache.$actionBarMenuHasDropdown.length) {
      actionBarDropdowns();
    }

    theme.cache.$window.on('resize', $.debounce(500, actionBarScroll));
  }

  function actionBarDropdowns() {
    var $activeSubNavItem = theme.cache.$actionBarSubMenus.find(
      '.action-bar--active'
    );
    var activeSubNavTarget = theme.cache.$activeActionBarHasSubMenu.attr(
      'data-child-list-handle'
    );
    var showClass = 'action-bar--show';

    theme.cache.$actionBarBack.on('click', closeSubNav);

    // Prevent Click Event on action bar links which have submenus if they
    // are active
    theme.cache.$actionBarMainMenu.on(
      'click',
      '.action-bar--disabled',
      function(evt) {
        evt.preventDefault();

        openSubNavFromNavItem();
      }
    );

    if ($activeSubNavItem.length) {
      openSubNavFromSubNavItem();
    }

    /*
      Open SubNav if there is an active Parent with a dropdown in the action bar
     */
    function openSubNavFromNavItem() {
      theme.cache.$actionBarMainMenu.removeClass(showClass);

      // loop through any dropdowns that exist
      theme.cache.$actionBarSubMenus.each(function() {
        var $el = $(this);

        if (activeSubNavTarget === $el.attr('data-child-list-handle')) {
          $el.prepareTransition().addClass(showClass);
          theme.setFocus($el.find('.action-bar__link').eq(0), 'action-bar');
        }
      });

      actionBarScroll();
    }

    /*
      Open SubNav if one of the action bar subnav links is active
     */
    function openSubNavFromSubNavItem() {
      //select the first active subnav item (uses .last() because jQuery)
      var $activeSubNav = $activeSubNavItem
        .parents('.action-bar__menu--sub')
        .last();

      theme.cache.$actionBarMainMenu.removeClass(showClass);
      $activeSubNav.addClass(showClass);

      // find parent menu item and mark it active
      theme.cache.$actionBarMenuHasDropdown.each(function() {
        var $el = $(this);
        var menuHandle = $el.attr('data-child-list-handle');

        if (menuHandle === $activeSubNav.attr('data-child-list-handle')) {
          $el.addClass('action-bar--disabled');

          //update the active parent childListHandle
          activeSubNavTarget = menuHandle;
        }
      });

      actionBarScroll();
    }

    function closeSubNav() {
      theme.cache.$actionBarSubMenus.removeClass(showClass);
      theme.cache.$actionBarMainMenu.prepareTransition().addClass(showClass);
      theme.setFocus(theme.cache.$actionBarMainMenuFirst, 'action-bar');
      actionBarScroll();
    }
  }

  function actionBarScroll() {
    // set dynamic variables which might have changed since the last time
    // actionBarScroll() was called
    var $activeActionBar = $('.action-bar--show');
    var activeActionBarWidth = $activeActionBar.width();
    //set action bar to be scrollable

    if (activeActionBarWidth > theme.variables.windowWidth) {
      var $activeLink = $activeActionBar.find('.action-bar--active');

      theme.cache.$actionBarWrapper.addClass('scrollable-js');

      //only scroll if a link is marked active
      if ($activeLink.length) {
        var activeOffset = $activeLink.offset().left;
        var scrollToLink = 0;

        if (activeOffset > theme.variables.windowWidth / 2) {
          scrollToLink = activeOffset - theme.variables.windowWidth / 3;

          theme.cache.$actionBar.animate({
            scrollLeft: scrollToLink
          });
        }
      }
    } else {
      theme.cache.$actionBarWrapper.removeClass('scrollable-js');
      theme.cache.$actionBar.animate({
        scrollLeft: 0
      });
    }

    theme.cache.$actionBar.on('scroll', $.throttle(100, scrollPosition));

    function scrollPosition() {
      var leftEdge = $activeActionBar.offset().left;

      // Make sure we've scrolled passed a buffer of 100px
      if (leftEdge < -100) {
        theme.cache.$actionBarWrapper.addClass('scrolled');
      } else {
        theme.cache.$actionBarWrapper.removeClass('scrolled');
      }
    }
  }

  function resizeEvents() {
    var windowWidth = theme.cache.$window.width();

    if (windowWidth === theme.variables.windowWidth) return;

    theme.variables.windowWidth = windowWidth;
    setStickyActionBarVariables();
  }

  function initStickyActionBar() {
    if (!theme.cache.$actionBar.length) {
      resizeHeader();
      return;
    }

    // if there is a slideshow we need to reset the 'top' of the page
    // to the bottom of the slideshow
    if (theme.cache.$hero.length) {
      theme.cache.$window.on('slick-initialized', function() {
        theme.cache.$heroContentWrapper.addClass('hero-initialized');
        setStickyActionBarVariables();
        stickyActionBar();
        theme.cache.$window.on('scroll', stickyActionBar);
      });
    } else {
      setStickyActionBarVariables();
      stickyActionBar();
      theme.cache.$window.on('scroll', stickyActionBar);
    }
  }

  function setStickyActionBarVariables() {
    if (!theme.cache.$actionBar.length) return;

    theme.variables.actionBarOffsetTop = theme.cache.$actionBar.offset().top;
    theme.variables.actionBarOffsetBottom =
      theme.cache.$actionBar.height() + theme.cache.$actionBar.offset().top;

    resizeHeader();
  }

  function resizeHeader() {
    var siteHeaderHeight = theme.cache.$siteHeader.height();

    // prevent content from jumping when we show/hide the header on non-index pages
    if (!theme.variables.isIndexTemplate) {
      theme.cache.$siteHeaderWrapper.css('height', siteHeaderHeight);
    }
  }

  function stickyActionBar() {
    var currentScrollTop = theme.cache.$window.scrollTop();

    // scroll down && we're below the header
    if (
      currentScrollTop > theme.variables.previousScrollPosition &&
      currentScrollTop > theme.variables.actionBarOffsetBottom
    ) {
      theme.cache.$body.addClass(theme.variables.stickyClass);

      var scrollTimeout = setTimeout(function() {
        theme.cache.$body.addClass(
          theme.variables.actionBarOpenTransitionClass
        );
      }, 50);
      theme.variables.previousScrollPosition = currentScrollTop;
    }

    // scroll Up
    if (currentScrollTop < theme.variables.previousScrollPosition) {
      clearTimeout(scrollTimeout);

      // show the regular ol' site header at the top of the page
      if (currentScrollTop <= theme.variables.actionBarOffsetTop) {
        theme.cache.$body
          .removeClass(theme.variables.stickyClass)
          .removeClass(theme.variables.actionBarOpenTransitionClass);
        theme.variables.previousScrollPosition = currentScrollTop;
      }
    }
  }

  return {
    init: init
  };
})();

theme.Collection = (function() {
  var selectors = {
    collectionGrid: '.collection-grid',
    collectionSort: '#SortBy',
    tagSort: '#SortTags',
    showMoreButton: '.js-show-more'
  };

  function init() {
    cacheSelectors();
    collectionSorting();
    tagSorting();
    initPagination();
  }

  function cacheSelectors() {
    var cache = {
      $collectionGrid: $(selectors.collectionGrid),
      $collectionSort: $(selectors.collectionSort),
      $tagSort: $(selectors.tagSort),
      $showMoreButton: $(selectors.showMoreButton)
    };

    $.extend(theme.cache, cache);
  }

  function collectionSorting() {
    theme.queryParams = {};
    var $sort = theme.cache.$collectionSort;

    if (!$sort.length) return;

    if (location.search.length) {
      for (
        var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&');
        i < aCouples.length;
        i++
      ) {
        aKeyValue = aCouples[i].split('=');
        if (aKeyValue.length > 1) {
          theme.queryParams[
            decodeURIComponent(aKeyValue[0])
          ] = decodeURIComponent(aKeyValue[1]);
        }
      }
    }

    // Enable sorting with current sort order as value
    $sort.val($sort.attr('data-value')).on('change', function() {
      theme.queryParams.sort_by = $(this).val();
      if (theme.queryParams.page) {
        delete theme.queryParams.page;
      }
      location.search = decodeURIComponent($.param(theme.queryParams));
    });
  }

  function tagSorting() {
    theme.cache.$tagSort.on('change', function() {
      var val = $(this).val();
      if (val) {
        window.location.href = $(this).val();
      }
    });
  }

  function initPagination() {
    if (!theme.cache.$showMoreButton.length) return;

    theme.cache.$showMoreButton.on('click', paginate);
  }

  function paginate(evt) {
    evt.preventDefault();

    // only send on ajax request at a time
    if (
      theme.cache.$showMoreButton.hasClass('btn--ajax-disabled') ||
      theme.cache.$showMoreButton.hasClass('btn--disabled')
    )
      return;

    theme.cache.$showMoreButton.addClass('btn--ajax-disabled');

    $.ajax({
      url: theme.cache.$showMoreButton.attr('href'),
      type: 'GET',
      dataType: 'html'
    })
      .done(function(data) {
        var $data = $(data);
        var $newItems = $data.find('.product-item');
        var showMoreUrl = $data.find('.js-show-more').attr('href');

        theme.cache.$collectionGrid.append($newItems);

        //update grid items selector so that the imagesLoaded plugin knows about them
        theme.cache.$productGridItem = $('.product-item');

        if (showMoreUrl.length) {
          theme.cache.$showMoreButton.attr('href', showMoreUrl);
        } else {
          theme.cache.$showMoreButton.addClass('btn--disabled');
        }
      })
      .always(function() {
        theme.cache.$showMoreButton.removeClass('btn--ajax-disabled');
      });
  }

  return {
    init: init
  };
})();




/*================ SECTIONS ================*/
theme.SlideshowSection = (function() {
  function SlideshowSection(container) {
    var $container = (this.$container = $(container));
    var slideshow = (this.slideshow = '#Hero');
    var $slideshowImages = $container.find('.hero__image');
    //eslint-disable-next-line no-unused-vars
    var autoplay = (this.autoplay = $(this.slideshow).data('autoplay'));

    slickTheme.init({
      $element: $(slideshow),
      autoplay: $(slideshow).data('autoplay'),
      autoplaySpeed: $(slideshow).data('autoplayspeed'),
      arrows: true
    });

    if ($('html').hasClass('is-ios') && Shopify.designMode) {
      $(slideshow).addClass('is-ios-editor');
    }

    $slideshowImages.imagesLoaded({ background: true }).progress(function() {
      $('.hero__image').addClass('image-loaded');
    });

    theme.drawersInit();
  }

  return SlideshowSection;
})();

theme.SlideshowSection.prototype = _.assignIn(
  {},
  theme.SlideshowSection.prototype,
  {
    onUnload: function() {
      $(this.slideshow).unslick();
    },

    onSelect: function() {
      if ($(this.slideshow).length) {
        var $heroContentWrapper = $(this.slideshow).find(
          '.hero__content-wrapper'
        );
        var adapt = $(this.slideshow).data('adapt');
        var $actionBar = $('.main-content').find('.hero__header');

        $heroContentWrapper.addClass('hero-initialized');
        $actionBar.toggleClass('hero__header--adapt', adapt);
      }
      theme.LeftDrawer.close();
    },

    onBlockSelect: function(evt) {
      var $slide = $('.hero__slide--' + evt.detail.blockId);
      var slideIndex = $slide.attr('index');

      $(this.slideshow).slickGoTo(slideIndex);
      if (this.autoplay) {
        $(this.slideshow).slickPause();
      }
    },

    onBlockDeselect: function() {
      if (
        this.autoplay &&
        !slickTheme.cache.$pauseButton.hasClass(slickTheme.vars.pausedClass)
      ) {
        $(this.slideshow).slickPlay();
      }
    }
  }
);

theme.SidebarMenuSection = (function() {
  function SidebarMenuSection() {
    $('.drawer-nav__toggle').on('click', function() {
      $(this)
        .parent()
        .toggleClass('drawer-nav--expanded');

      if (
        $(this)
          .parent()
          .hasClass('drawer-nav--expanded')
      ) {
        $(this)
          .children('.drawer-nav__toggle-button')
          .attr('aria-expanded', true);
        $(this)
          .find('.icon-plus')
          .removeClass('icon-plus')
          .addClass('icon-minus');
      } else {
        $(this)
          .children('.drawer-nav__toggle-button')
          .attr('aria-expanded', false);
        $(this)
          .find('.icon-minus')
          .removeClass('icon-minus')
          .addClass('icon-plus');
      }
    });
  }

  return SidebarMenuSection;
})();

theme.SidebarMenuSection.prototype = _.assignIn(
  {},
  theme.SidebarMenuSection.prototype,
  {
    onSelect: function() {
      theme.RightDrawer.close();
      theme.SearchDrawer.close();
      theme.LeftDrawer.open();
    },

    onDeselect: function() {
      theme.LeftDrawer.close();
    }
  }
);

theme.HeaderSection = (function() {
  function HeaderSection() {
    theme.drawersInit();
  }

  return HeaderSection;
})();

theme.HeaderSection.prototype = _.assignIn({}, theme.HeaderSection.prototype, {
  onSelect: function() {
    theme.LeftDrawer.close();
  }
});

theme.ActionBarSection = (function() {
  function ActionBarSection() {
    theme.ActionBar.init();
  }

  return ActionBarSection;
})();

theme.ActionBarSection.prototype = _.assignIn(
  {},
  theme.ActionBarSection.prototype,
  {
    onSelect: function() {
      theme.LeftDrawer.close();
    }
  }
);

theme.CollectionTemplate = (function() {
  function CollectionTemplate(container) {
    theme.Collection.container = container;
    theme.Collection.init();
  }

  return CollectionTemplate;
})();

/* eslint-disable no-new */
theme.Product = (function() {
  var settings = {
    imageSize: null
  };

  var selectors = {
    addToCart: '.btn--add-to-cart',
    btnText: '.btn__text',
    cartContainer: '#CartContainer',
    originalSelectorId: 'ProductSelect',
    productForm: '.product__form--add-to-cart',
    productPrice: '.product__price--reg',
    salePrice: '.product__price .js-price',
    salePriceWrapper: '.product__price--sale',
    unitPrice: '[data-unit-price]',
    unitPriceBaseUnit: '[data-unit-price-base-unit]',
    unitPriceContainer: '[data-unit-price-container]',
    variantImage: '.product__photo--variant',
    variantImageWrapper: '.product__photo--variant-wrapper',
    SKU: '.variant-sku',
    pageLink: '[data-page-link]',
    historyState: '[data-history-state]',
    shopifyPaymentButton: '.shopify-payment-button'
  };

  function Product(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    // If section has data-history-state, Shopify.OptionSelectors will enableHistoryState
    var historyState = $container.is(selectors.historyState) ? true : false;
    var image_size = 0;

    this.$addToCartButton = $(selectors.addToCart, $container);
    this.$addToCartText = this.$addToCartButton.find(selectors.btnText);

    if (
      typeof $(selectors.variantImage, this.$container).attr('src') !==
      'undefined'
    ) {
      image_size = Shopify.Image.imageSize(
        $(selectors.variantImage, this.$container).attr('src')
      );
    }

    this.settings = $.extend({}, settings, {
      sectionId: sectionId,
      originalSelectorId: selectors.originalSelectorId + '-' + sectionId,
      historyState: historyState,
      imageSize: image_size,
      addToCartFormId: '#AddToCartForm' + '-' + sectionId,
      addToCartBtnId: '#AddToCart' + '-' + sectionId
    });

    theme.styleTextLinks();

    // Stop parsing if we don't have the product json script tag when loading
    // section in the Theme Editor
    if (!$('#ProductJson-' + sectionId).html()) return;

    this.productSingleObject = JSON.parse(
      document.getElementById('ProductJson-' + sectionId).innerHTML
    );

    this.init();

    // Pre-loading product images to avoid a lag when a thumbnail is clicked, or
    // when a variant is selected that has a variant image
    Shopify.Image.preload(
      this.productSingleObject.images,
      this.settings.imageSize
    );
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    init: function() {
      this.initVariantSelectors(this.settings.originalSelectorId);

      if (theme.settings.cartType === 'drawer') {
        ajaxCart.init({
          formSelector: this.settings.addToCartFormId,
          cartContainer: selectors.cartContainer,
          addToCartSelector: this.settings.addToCartBtnId,
          moneyFormat: theme.settings.moneyFormat
        });
      }
    },

    initVariantSelectors: function(selectorId) {
      this.optionSelector = new Shopify.OptionSelectors(selectorId, {
        product: this.productSingleObject,
        onVariantSelected: this.productVariantCallback.bind(this),
        enableHistoryState: this.settings.historyState
      });

      var firstSelector = this.optionSelector.selectors[0];

      // Add label if there is only one option and no existing label
      if (
        this.productSingleObject.options.length === 1 &&
        $(firstSelector.element).siblings('label').length === 0
      ) {
        var optionLabel = document.createElement('label');
        optionLabel.htmlFor = firstSelector.element.id;
        optionLabel.innerHTML = firstSelector.name;
        $(optionLabel).insertBefore($(firstSelector.element));
      }

      // Clean up variant labels if the Shopify-defined
      // defaults are the only ones left
      this.simplifyVariantLabels(this.productSingleObject, this.$container);

      // Uncomment this to add class so we can easily hide any
      // <select> with only one option
      // $optionSelectors.each(function () {
      //   var $el = $(this);
      //   var $select = $el.find('.single-option-selector');
      //
      //   if ($select[0].length < 2) {
      //     $el.addClass('selector-wrapper--single-option');
      //   }
      // });
    },

    simplifyVariantLabels: function(productObject, container) {
      // Hide variant dropdown if only one exists and title contains 'Default'
      if (
        productObject.variants.length === 1 &&
        productObject.options.length === 1 &&
        productObject.options[0].toLowerCase().indexOf('title') >= 0 &&
        productObject.variants[0].title
          .toLowerCase()
          .indexOf('default title') >= 0
      ) {
        $('.selector-wrapper', container).hide();
      }
    },

    productVariantCallback: function(variant) {
      var $pageLink = $(selectors.pageLink, this.$container);

      if (variant) {
        if (variant.featured_image) {
          var imageId = variant.featured_image.id;
          var $newImage = $(
            selectors.variantImageWrapper + "[data-image-id='" + imageId + "']",
            this.$container
          );
          var $otherImages = $(
            selectors.variantImageWrapper +
              ":not([data-image-id='" +
              imageId +
              "'])",
            this.$container
          );

          $newImage.removeClass('hide fade-in');
          $otherImages.addClass('hide');
        } else {
          $(selectors.variantImageWrapper, this.$container).removeClass(
            'fade-in'
          );
        }

        // Select a valid variant if available
        if (variant.available) {
          // Available, enable the submit button, change text, show quantity elements
          $(selectors.addToCart, this.$container)
            .removeClass('disabled')
            .prop('disabled', false);
          this.$addToCartText.html(theme.strings.addToCart);
          $(selectors.shopifyPaymentButton, this.$container).show();
        } else {
          // Sold out, disable the submit button, change text, hide quantity elements
          $(selectors.addToCart, this.$container)
            .addClass('disabled')
            .prop('disabled', true);
          this.$addToCartText.html(theme.strings.soldOut);
          $(selectors.shopifyPaymentButton, this.$container).hide();
        }

        $(selectors.productPrice, this.$container).html(
          Shopify.formatMoney(
            variant.price,
            theme.settings.moneyFormat
          ).replace(/((,00)|(\.00))$/g, '')
        );

        // Show SKU
        $(selectors.SKU, this.$container).html(variant.sku);

        // Also update and show the product's compare price if necessary
        if (variant.compare_at_price > variant.price) {
          $(selectors.salePriceWrapper, this.$container).removeClass('hide');
          $(selectors.productPrice, this.$container).html(
            Shopify.formatMoney(
              variant.compare_at_price,
              theme.settings.moneyFormat
            ).replace(/((,00)|(\.00))$/g, '')
          );
          $(selectors.salePrice, this.$container).html(
            Shopify.formatMoney(
              variant.price,
              theme.settings.moneyFormat
            ).replace(/((,00)|(\.00))$/g, '')
          );
          $(selectors.productPrice, this.$container).addClass('on-sale');
        } else {
          $(selectors.productPrice, this.$container).html(
            Shopify.formatMoney(
              variant.price,
              theme.settings.moneyFormat
            ).replace(/((,00)|(\.00))$/g, '')
          );
          $(selectors.salePriceWrapper, this.$container).addClass('hide');
          $(selectors.productPrice, this.$container).removeClass('on-sale');
        }

        $(selectors.unitPriceContainer, this.$container).addClass(
          'product-price-unit--unavailable'
        );
        if (variant.unit_price_measurement) {
          $(selectors.unitPrice, this.$container).html(
            Shopify.formatMoney(variant.unit_price, theme.settings.moneyFormat)
          );
          $(selectors.unitPriceBaseUnit, this.$container).html(
            this.getBaseUnit(variant)
          );
          $(selectors.unitPriceContainer, this.$container).removeClass(
            'product-price-unit--unavailable'
          );
        }

        // Update the product page link, if it exists
        if ($pageLink.length > 0) {
          var variantUrl = this._updateUrlParameter(
            $pageLink.attr('href'),
            'variant',
            variant.id
          );
          $pageLink.attr('href', variantUrl);
        }
      } else {
        // The variant doesn't exist, disable submit button.
        // This may be an error or notice that a specific variant is not available.
        // To only show available variants, implement linked product options:
        //   - http://docs.shopify.com/manual/configuration/store-customization/advanced-navigation/linked-product-options
        $(selectors.addToCart, this.$container)
          .addClass('disabled')
          .prop('disabled', true);
        this.$addToCartText.html(theme.strings.unavailable);
        $(selectors.shopifyPaymentButton, this.$container).hide();
      }
    },

    _updateUrlParameter: function(url, key, value) {
      var re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
      var separator = url.indexOf('?') === -1 ? '?' : '&';

      if (url.match(re)) {
        return url.replace(re, '$1' + key + '=' + value + '$2');
      } else {
        return url + separator + key + '=' + value;
      }
    },

    getBaseUnit: function(variant) {
      return variant.unit_price_measurement.reference_value === 1
        ? variant.unit_price_measurement.reference_unit
        : variant.unit_price_measurement.reference_value +
            variant.unit_price_measurement.reference_unit;
    }
  });

  return Product;
})();

theme.RichTextSection = (function() {
  function RichTextSection() {}

  return RichTextSection;
})();

theme.RichTextSection.prototype = _.assignIn(
  {},
  theme.RichTextSection.prototype,
  {
    onSelect: function() {
      theme.styleTextLinks();
    }
  }
);

theme.NewsletterSection = (function() {
  function NewsletterSection() {
    theme.styleTextLinks();
  }

  return NewsletterSection;
})();

theme.Maps = (function() {
  var config = {
    zoom: 14
  };
  var apiStatus = null;
  var mapsToLoad = [];

  function Map(container) {
    theme.$currentMapContainer = this.$container = $(container);
    var key = this.$container.data('api-key');

    if (typeof key !== 'string' || key === '') return;

    if (apiStatus === 'loaded') {
      var self = this;

      // Check if the script has previously been loaded with this key
      var $script = $('script[src*="' + key + '&"]');
      if ($script.length === 0) {
        $.getScript(
          'https://maps.googleapis.com/maps/api/js?key=' + key
        ).then(function() {
          apiStatus = 'loaded';
          self.createMap();
        });
      } else {
        this.createMap();
      }
    } else {
      mapsToLoad.push(this);

      if (apiStatus !== 'loading') {
        apiStatus = 'loading';
        if (typeof window.google === 'undefined') {
          $.getScript(
            'https://maps.googleapis.com/maps/api/js?key=' + key
          ).then(function() {
            apiStatus = 'loaded';
            initAllMaps();
          });
        }
      }
    }
  }

  function initAllMaps() {
    // API has loaded, load all Map instances in queue
    $.each(mapsToLoad, function(index, instance) {
      instance.createMap();
    });
  }

  function geolocate($map) {
    var deferred = $.Deferred();
    var geocoder = new google.maps.Geocoder();
    var address = $map.data('address-setting');

    geocoder.geocode({ address: address }, function(results, status) {
      if (status !== google.maps.GeocoderStatus.OK) {
        deferred.reject(status);
      }

      deferred.resolve(results);
    });

    return deferred;
  }

  Map.prototype = _.assignIn({}, Map.prototype, {
    createMap: function() {
      var $map = this.$container.find('.map-section__container');

      return geolocate($map)
        .then(
          function(results) {
            var mapOptions = {
              zoom: config.zoom,
              styles: config.styles,
              center: results[0].geometry.location,
              draggable: false,
              clickableIcons: false,
              scrollwheel: false,
              disableDoubleClickZoom: true,
              disableDefaultUI: true
            };

            var map = (this.map = new google.maps.Map($map[0], mapOptions));
            var center = (this.center = map.getCenter());

            //eslint-disable-next-line no-unused-vars
            var marker = new google.maps.Marker({
              map: map,
              position: center
            });

            google.maps.event.addDomListener(
              window,
              'resize',
              $.debounce(250, function() {
                google.maps.event.trigger(map, 'resize');
                map.setCenter(center);
              })
            );
          }.bind(this)
        )
        .fail(function() {
          var errorMessage;

          switch (status) {
            case 'ZERO_RESULTS':
              errorMessage = theme.strings.addressNoResults;
              break;
            case 'OVER_QUERY_LIMIT':
              errorMessage = theme.strings.addressQueryLimit;
              break;
            default:
              errorMessage = theme.strings.addressError;
              break;
          }

          var $mapContainer = $map.parents('.map-section');

          // Only show error in the theme editor
          if (Shopify.designMode) {
            $mapContainer.addClass('page-width map-section--load-error');
            $mapContainer.find('.map-section__content-wrapper').remove();
            $mapContainer
              .find('.map-section__wrapper')
              .html(
                '<div class="errors text-center" style="width: 100%;">' +
                  errorMessage +
                  '</div>'
              );
          } else {
            $mapContainer.removeClass('map-section--display-map');
          }
        });
    },

    onUnload: function() {
      if (typeof window.google !== 'undefined') {
        google.maps.event.clearListeners(this.map, 'resize');
      }
    }
  });

  return Map;
})();

// Global function called by Google on auth errors.
// Show an auto error message on all map instances.
// eslint-disable-next-line camelcase, no-unused-vars
function gm_authFailure() {
  if (Shopify.designMode) {
    theme.$currentMapContainer.addClass('page-width map-section--load-error');
    theme.$currentMapContainer.find('.map-section__content-wrapper').remove();
    theme.$currentMapContainer
      .find('.map-section__wrapper')
      .html(
        '<div class="errors text-center" style="width: 100%;">' +
          theme.strings.authError +
          '</div>'
      );
  } else {
    theme.$currentMapContainer.removeClass('map-section--display-map');
  }
}

theme.FeaturedVideoSection = (function() {
  function FeaturedVideoSection() {
    theme.responsiveVideos();
  }

  return FeaturedVideoSection;
})();

theme.FeaturedVideoSection.prototype = _.assignIn(
  {},
  theme.FeaturedVideoSection.prototype,
  {
    onSelect: function() {
      theme.responsiveVideos();
    }
  }
);

theme.PasswordContentSection = (function() {
  function PasswordContentSection() {
    theme.styleTextLinks();
  }

  return PasswordContentSection;
})();

theme.ProductRecommendations = (function() {
  function ProductRecommendations(container) {
    this.$container = $(container);

    var baseUrl = this.$container.data('baseUrl');
    var productId = this.$container.data('productId');
    var recommendationsSectionUrl =
      baseUrl +
      '?section_id=product-recommendations&product_id=' +
      productId +
      '&limit=4';

    $.get(recommendationsSectionUrl).then(
      function(section) {
        var recommendationsMarkup = $(section).html();
        if (recommendationsMarkup.trim() !== '') {
          this.$container.html(recommendationsMarkup);
        }
      }.bind(this)
    );
  }

  return ProductRecommendations;
})();


/**
 *
 *  Boundless Theme JS
 *
 *
 */
theme.init = function () {
  theme.cacheSelectors();
  theme.stringOverrides();
  theme.drawersInit();
  theme.initCart();
  theme.afterCartLoad();
  theme.rteImages();
  theme.styleTextLinks();
  theme.searchSubmit();
  theme.socialSharing();
  theme.passwordTemplate();
  theme.responsiveVideos();
  theme.checkIfIOS();
  theme.productCardImageLoadingAnimation();
};

/**
 *
 *  Cache any jQuery objects.
 *
 */
theme.cacheSelectors = function () {
  theme.cache = {
    $window: $(window),
    $html: $('html'),
    $body: $('body'),
    $indexTemplate: $('.template-index'),
    $cartSectionTemplate: $('.cart-template-section'),

    // Drawer elements
    $drawerRight: $('.drawer--right'),
    $drawerProduct: $('.drawer--product'),
    $cartContainer: $('#CartContainer'),

    // Product grid
    $productGridItem: $('.product-item'),

    // Share buttons
    $shareButtons: $('.social-sharing'),

    // Article images
    $indentedRteImages: $('.rte--indented-images'),

    // Password Page
    $loginModal: $('#LoginModal'),

    // Announcement Bar
    $announcementBar: $('.announcement-bar'),

    // Site Header
    $siteHeaderWrapper: $('.site-header-wrapper'),
    $siteHeader: $('.site-header-container'),
    $siteHeaderCart: $('.site-header__cart'),
    $searchInput: $('.search-bar__input'),
    $searchSubmit: $('.search-bar__submit'),

    // Hero
    $heroContentWrapper: $('.hero__content-wrapper'),
    $hero: $('#Hero'),
    $heroImages: $('.hero__image'),

    // Cart classes
    cartNoCookies: 'cart--no-cookies'

  }

  theme.variables = {
    isIndexTemplate: theme.cache.$indexTemplate.length,

    // Footer
    footerTop: 0,

    // track window width to solve iOS scroll triggering resize event
    windowWidth: theme.cache.$window.width()
  };
};

theme.stringOverrides = function () {
  // Override defaults in theme.strings with potential
  // template overrides
  window.productStrings = window.productStrings || {};
  $.extend(theme.strings, window.productStrings);
};

theme.initCart = function() {
  

  if (!theme.cookiesEnabled()) {
    theme.cache.$cartContainer.addClass(theme.cache.cartNoCookies);
    theme.cache.$cartSectionTemplate.addClass(theme.cache.cartNoCookies);
  }
};

theme.cookiesEnabled = function() {
  var cookieEnabled = navigator.cookieEnabled;

  if (!cookieEnabled){
    document.cookie = 'testcookie';
    cookieEnabled = (document.cookie.indexOf('testcookie') !== -1);
  }
  return cookieEnabled;
};

theme.drawersInit = function () {
  // Add required classes to HTML
  $('#PageContainer').addClass('drawer-page-content');
  $('.js-drawer-open-right').attr('aria-controls', 'CartDrawer').attr('aria-expanded', 'false');
  $('.js-drawer-open-left').attr('aria-controls', 'NavDrawer').attr('aria-expanded', 'false');
  $('.js-drawer-open-top').attr('aria-controls', 'SearchDrawer').attr('aria-expanded', 'false');

  theme.LeftDrawer = new theme.Drawers('NavDrawer', 'left');
  theme.RightDrawer = new theme.Drawers('CartDrawer', 'right', {
    
  });
  theme.SearchDrawer = new theme.Drawers('SearchDrawer', 'top', {'onDrawerOpen': theme.searchFocus});
};

theme.searchFocus = function () {
  theme.cache.$searchInput.focus();
  // set selection range hack for iOS
  theme.cache.$searchInput[0].setSelectionRange(0, theme.cache.$searchInput[0].value.length);
};

theme.searchSubmit = function () {
  theme.cache.$searchSubmit.on('click', function(evt) {
    if (theme.cache.$searchInput.val().length == 0) {
      evt.preventDefault();
      theme.cache.$searchInput.focus();
    }
  });
};

theme.socialSharing = function () {
  // Stop initializing if settings are disabled
  
    return;
  

  // General selectors
  var $buttons = theme.cache.$shareButtons;
  var $shareLinks = $buttons.find('a');
  var permalink = $buttons.attr('data-permalink');

  // Share popups
  $shareLinks.on('click', function(e) {
    e.preventDefault();
    var $el = $(this);
    var popup = $el.attr('class').replace('-','_');
    var link = $el.attr('href');
    var w = 700;
    var h = 400;

    // Set popup sizes
    switch (popup) {
      case 'share-twitter':
        h = 300;
        break;
      case 'share-fancy':
        w = 480;
        h = 720;
        break;
      case 'share-google':
        w = 500;
        break;
    }

    window.open(link, popup, 'width=' + w + ', height=' + h);
  });
}

theme.sizeCartDrawerFooter = function () {
  // Stop if our drawer doesn't have a fixed footer
  if (!theme.cache.$drawerRight.hasClass('drawer--has-fixed-footer')) return;


  // Elements are reprinted regularly so selectors are not cached
  var $cartFooter = $('.ajaxcart__footer').removeAttr('style');
  var $cartInner = $('.ajaxcart__inner').removeAttr('style');
  var cartFooterHeight = $cartFooter.outerHeight();

  $cartInner.css('bottom', cartFooterHeight);
  $cartFooter.css('height', cartFooterHeight);
};

theme.afterCartLoad = function () {
  theme.cache.$cartContainer.on('ajaxCart.afterCartLoad', function(evt, cart) {
    theme.RightDrawer.open();

    // set cart bubble after ajax cart update
    if (cart.item_count > 0) {
      theme.cache.$siteHeaderCart.addClass('cart-bubble--visible');
    } else {
      theme.cache.$siteHeaderCart.removeClass('cart-bubble--visible');
    }

    // Size the cart's fixed footer
    theme.sizeCartDrawerFooter();
  });

  theme.cache.$cartContainer.on('ajaxCart.updatingQty', function() {
    $('.cart__checkout').addClass('btn--ajax-disabled');
  });
};

theme.rteImages = function () {
  if (!theme.cache.$indentedRteImages.length) return;


  var $images = theme.cache.$indentedRteImages.find('img');
  var $rteImages = imagesLoaded($images);

  $rteImages.on('always', function (instance, image) {
    $images.each(function() {
      var $el = $(this);
      var imageWidth = $el.width();
      var attr = $el.attr('style');

      // Check if undefined or float: none
      if (!attr || attr == 'float: none;') {
        // Remove grid-breaking styles if image isn't wider than parent + 20%
        // negative margins set in CSS
        if (imageWidth < theme.cache.$indentedRteImages.width() * 1.4) {
          $el.addClass('rte__no-indent');
        }
      }
    });
  });
};

theme.styleTextLinks = function () {
  $('.rte').find('a:not(:has(img))').addClass('text-link');
}

theme.setFocus = function ($container, eventNamespace) {
  var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';

  $container.attr('tabindex', '-1');

  $container.focus();

  $(document).on(eventName, function (evt) {
    if ($container[0] !== evt.target && !$container.has(evt.target).length) {
      $container.focus();

      //only set focus once
      $(document).off(eventName)
      $container.removeAttr('tabindex');
    }
  });
};

theme.passwordTemplate = function () {
  if (!theme.cache.$loginModal.length) return;

  // Initialize modal
  theme.PasswordModal = new window.Modals('LoginModal', 'login-modal', {
    $focusOnOpen: '#Password'
  });

  // Open modal if errors exist
  if (theme.cache.$loginModal.find('.errors').length) {
    theme.PasswordModal.open();
  }
};

theme.responsiveVideos = function () {
  var $iframeVideo = $('iframe[src*="youtube.com/embed"], iframe[src*="player.vimeo"]');
  var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');

  $iframeVideo.each(function () {
    // Add wrapper to make video responsive
    if(!$(this).parent().hasClass('video-wrapper')){
      $(this).wrap('<div class="video-wrapper"></div>');
    }
  });

  $iframeReset.each(function () {
    // Re-set the src attribute on each iframe after page load
    // for Chrome's "incorrect iFrame content on 'back'" bug.
    // https://code.google.com/p/chromium/issues/detail?id=395791
    // Need to specifically target video and admin bar
    this.src = this.src;
  });
};

theme.checkIfIOS = function() {
  var ua = navigator.userAgent.toLowerCase();
  var isIOS = /ipad|iphone|ipod/.test(ua) && !window.MSStream;

  if (isIOS) {
    $('html')
      .addClass('is-ios');
  }
};

theme.productCardImageLoadingAnimation = function() {
  var selectors = {
    image: '[data-image]',
    imageWithPlaceholder: '[data-image-placeholder]',
    imageWithPlaceholderWrapper: '[data-image-with-placeholder-wrapper]'
  };

  var classes = {
    loadingAnimation: 'product-item__image-container--loading',
    lazyloaded: '.lazyloaded'
  };

  $(document).on('lazyloaded', function(e) {
    var $target = $(e.target);

    if (!$target.is(selectors.image)) {
      return;
    }

    $target
      .closest(selectors.imageWithPlaceholderWrapper)
      .removeClass(classes.loadingAnimation)
      .find(selectors.imageWithPlaceholder)
      .hide();
  });

  // When the theme loads, lazysizes might load images before the "lazyloaded"
  // event listener has been attached. When this happens, the following function
  // hides the loading placeholders.
  $(selectors.image + classes.lazyloaded)
    .closest(selectors.imageWithPlaceholderWrapper)
    .removeClass(classes.loadingAnimation)
    .find(selectors.imageWithPlaceholder)
    .hide();
};

$(document).ready(function() {
  theme.init();

  var sections = new theme.Sections();

  sections.register('action-bar-section', theme.ActionBarSection);
  sections.register('slideshow-section', theme.SlideshowSection);
  sections.register('sidebar-menu-section', theme.SidebarMenuSection);
  sections.register('header-section', theme.HeaderSection);
  sections.register('collection-template-section', theme.CollectionTemplate);
  sections.register('product', theme.Product);
  sections.register('rich-text-section', theme.RichTextSection);
  sections.register('newsletter-signup-section', theme.NewsletterSection);
  sections.register('featured-video-section', theme.FeaturedVideoSection);
  sections.register('map-section', theme.Maps);
  sections.register('password-content-section', theme.PasswordContentSection);
  sections.register('product-recommendations', theme.ProductRecommendations);
});
