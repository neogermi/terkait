this.manifest = {
    "name": "terkait Options",
    "icon": "../../icons/icon32.png",
    "settings": [
        {
            "tab": i18n.get("information"),
            "group": i18n.get("mode"),
            "name": "modeRadioButtons",
            "type": "radioButtons",
            "label": i18n.get("mode-label"),
            "options": [
                        ["normal", "Normal"]/*,
                        ["poweruser", "Power User"],
                        ["annotate", "Annotate.js"]*/
                    ]
        },
        {
            "tab": i18n.get("information"),
            "group": i18n.get("services"),
            "name": "stanbol",
            "type": "text",
            "label": "Apache Stanbol URL(s)",
            "text": "http://dev.iks-project.eu/stanbolfull",
            "masked": false
        },
        /*{
            "tab": i18n.get("information"),
            "group": i18n.get("services"),
            "name": "opencalais",
            "type": "text",
            "label": i18n.get("opencalais-key-label"),
            "text": "0123456789abcdefghijklmn",
            "masked": false
        },
        {
            "tab": i18n.get("information"),
            "group": i18n.get("services"),
            "name": "zemanta",
            "type": "text",
            "label": i18n.get("zemanta-key-label"),
            "text": "0123456789abcdefghijklmn",
            "masked": false
        },*/
        {
            "tab": i18n.get("information"),
            "group": i18n.get("filter"),
            "name": "filterCheckboxPlace",
            "type": "checkbox",
            "label": i18n.get("places")
        },
        {
            "tab": i18n.get("information"),
            "group": i18n.get("filter"),
            "name": "filterCheckboxPerson",
            "type": "checkbox",
            "label": i18n.get("persons")
        },
        {
            "tab": i18n.get("information"),
            "group": i18n.get("filter"),
            "name": "filterCheckboxOrganization",
            "type": "checkbox",
            "label": "Organziation"
        },
        /*{
            "tab": i18n.get("information"),
            "group": i18n.get("filter"),
            "name": "filterCheckboxProduct",
            "type": "checkbox",
            "label": "Product"
        },*/
        {
            "tab": i18n.get("information"),
            "group": i18n.get("max-entities"),
            "name": "maxEntities",
            "type": "slider",
            "min"  : 1,
            "max"  : 20,
            "step" : 1,
            "display" : true
        },
        {
            "tab": i18n.get("security"),
            "group": i18n.get("allowOnHttps"),
            "name": "allowOnHttps",
            "type": "checkbox",
            "label": i18n.get("allow")
        }
    ],
    "alignment": [
          [
              "stanbol"
              /*,
              "opencalais",
              "zemanta"*/
          ]
      ]
};
