$(function() {
  $('table .quantity:first').focus();
  $('[max]').change(function() {
    var max = parseInt($(this).attr('max'), 10);
    var value = parseInt($(this).val(), 10) || 0;
    if (value > max) {
      alert('We only have ' + max + ' of this item in stock');
      $(this).val(max);
    }
  });

  // Change displayed collection
  $('#select-collection').change(function(){
    document.location.href = '/pages/order-form/'+ $(this).val();
  });

  // Order form popup
  var selectedRowCell
  $('.configure-options').click(function(event) {
    event.preventDefault()
    selectedRowCell = $(this).parents('td')
    console.log(selectedRowCell)
    $('#order-form-modal').addClass('modal--is-active')
  });

  $('.order-form-modal__close').click(function(event) {
    event.preventDefault();
    saveRowProperties();
    printRowProperties();
    $('#order-form-modal').removeClass('modal--is-active');
  });

  function saveRowProperties() {
    var line_prop_name = $('.order-form-modal__inner').find('label').eq(0).text();
    if ($('.order-form-modal__inner').find('input').length > 0) {
      line_prop_value = $('.order-form-modal__inner').find('input:checked').val()
    }
    if ($('.order-form-modal__inner').find('select').length > 0) {
      line_prop_value = $('.order-form-modal__inner').find('select').val()
    }
    if ($('.order-form-modal__inner').find('#custom').length > 0 && !line_prop_value) {
      line_prop_value = "No"
    }
    selectedRowCell.data(line_prop_name, line_prop_value);
    console.log(line_prop_value)
    console.log(selectedRowCell.data());
  }

  function printRowProperties() {
    $(selectedRowCell).find('.selected-line-properties').html("<p>" +
      Object.keys(selectedRowCell.data())[0] + ": " +
      Object.values(selectedRowCell.data())[0] +
      "</p>")
  }

  var getParameter = function(parameter, selector) {
    var variantId = $(selector).find('select').val() || $(selector).find('data').val();
    var parameterId = '#'+ parameter + '-' + variantId + '-' + $(selector).attr('row');
    return $(selector).find(parameterId);
  }

  //Initial form setup
  $( document ).ready(function() {
    $("tr[row='1']").show();
    $('.price').hide();
    $('.quantity-field').hide();
    $('tr').each(function() {
      var variantId = $(this).find('select').val() || $(this).find('data').val();
      var priceId = '#p-' + variantId + '-' + $(this).attr('row');
      var quantityId = '#q-' + variantId + '-' + $(this).attr('row');
      $(priceId).show();
      $(quantityId).show();
    });
  });

  // Change the price and quantity to align with the selected option
  $('select').change(function(){
    var priceId = '#p-' + $(this).val() + '-' + $(this).parents('tr').attr('row');
    var quantityId = '#q-' + $(this).val() + '-' + $(this).parents('tr').attr('row');
 	$(priceId).siblings().hide();
    $(priceId).show();
    $(quantityId).siblings().hide();
    $(quantityId).show();
  });

  // Add another row if selected variant has line item properties or options
  $('tr').change(function() {
    var quantity = parseInt(getParameter('q', this).val());
    if (quantity > 0) {
      $(this).next().fadeIn();
  	}
  });

  // Running cart total
  $('.quantity-field').change(function(){
    var cartTotal = 0;
    $('tr').each(function(){
      var price = parseFloat(getParameter('p', this).text().slice(2));
      var quantity = parseInt(getParameter('q', this).val());
      cartTotal += price*quantity;
    });
    $('.cart-total').html(cartTotal.toFixed(2));
  });

  // Hide popup error message on moveover
  $('.order-form__tablecell--popuptext').hover(function() {
    $(this).fadeOut();
  });

  // Add selected items to Cart
  // Source: https://help.shopify.com/en/themes/development/getting-started/using-ajax-api#youre-building-a-quick-order-form-beware
  var cartQueue = [];

  var moveAlong = function() {
    if (cartQueue.length) {
      var request = cartQueue.shift();
      console.log(request);
      addItem(request.variantId, request.quantity, request.properties);
    }
    else {
      document.location.href = '/checkout';
    }
  };

  var addItem = function(variantId, quantity, properties) {
    jQuery.post( '/cart/add.js', { quantity: quantity, id: variantId, properties: properties}, null, "json")
    .done(function(response) {
      console.log('Post Done!', response);
      moveAlong();
    });
  }

  var radioButtonMessage = function(el) {
  	console.log('oh no', el)
    el.find('.order-form__tablecell--popuptext').show()
    $('.order-form__error-message').fadeIn()
  }

  $('#post-order').submit(function(event) {
    event.preventDefault()
    var radioButtonChecked = true;
    var requiredLineProperty = $('table').attr("required-line-prop")
    $('tr').each(function() {
      var quantity = parseInt(getParameter('q', this).val());
      var properties = $(this).find('.line-properties').data()

      if ( quantity > 0 ) {
        console.log(properties)
        if ($(this).find('.configure-options').length > 0) {
          if (requiredLineProperty && !properties[requiredLineProperty]) {
            radioButtonMessage($(this));
            radioButtonChecked = false;
          }
        }
        cartQueue.push({
          variantId: $(this).find('select').val() || $(this).find('data').val(),
          quantity: quantity,
          properties: properties
        });
      }
    });
    if (radioButtonChecked) {
      moveAlong();
    } else {
      cartQueue = [];
    }
  });
});