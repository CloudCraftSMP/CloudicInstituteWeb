var options = {
    strings: [
        'Institüüt að Pilvea Kie', // Cloudic (Latin)
        'Институт аж Пилвэа Щиэ', // Cloudic (Cyrillic)
        'Pilvikielen sääntelylaitos', // Finnish
        'Skyspråkreguleringsinstitusjon', // Norwegian
        'Skýjamálaeftirlitsstofnun', // Icelandic
        //'CloudCraftap naalagaassuseqa',
        //'CloudCraftaid Ráđđehus', // Northern Sámi
        //'CloudCraftin abuniekkut', // Karelian
        'Pilvekeele Reguleerimise Asutus', // Estonian
        'Institución de Regulación del Lenguaje en la Nube', // Spanish
        'Instituição Reguladora de Idiomas na Nuvem', // Portugese
        'Institiúid Rialála Teanga Scamall', // Irish Gaelic
    ],
    typeSpeed: 40,
    backSpeed: 50,
    loop: true,
    backDelay: 2000,
};

var typed = new Typed('#navbar-brand', options);

jQuery('div.dropdown').hover(function() {

    jQuery(this).find('.dropdown-menu').stop(true, true).delay(200).fadeIn(300);
  }, function() {
  jQuery(this).find('.dropdown-menu').stop(true, true).delay(200).fadeOut(300);
});
