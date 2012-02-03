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
                        ["normal", "Normal"],
                        ["poweruser", "Power User"],
                        ["annotate", "Annotate.js"]
                    ]
        },
        {
            "tab": i18n.get("information"),
            "group": i18n.get("services"),
            "name": "stanbol",
            "type": "text",
            "label": "Apache Stanbol URL(s)",
            "text": "http://some-stanbol-url.org",
            "masked": false
        },
        {
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
        }
    ],
    "alignment": [
          [
              "stanbol",
              "opencalais",
              "zemanta"
          ]
      ]
};
