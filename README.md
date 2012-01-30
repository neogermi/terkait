# terkait

terkait is a [VIE](https://github.com/bergie/VIE) meta-widget and is conceived as a platform for exploitation of semantic knowledge at browser level. Basing on the recognition of semantically annotated content or semantic enhancement of content on web sites, interaction with the given content is realized which uses underlying semantics for interfacing with existing services (e.g., retrieval of related multimedia content) or creating new interactions (e.g., semantic navigation of given content).

terkait is currently only available as a [Google chrome extension](https://www.google.com/chrome/) with the purpose to easily demonstrate the capabilities of VIE and VIE widgets. However, the extension-specific code parts are rather small and there are plans to release versions for other browsers soon.

![Terkait example](https://github.com/neogermi/terkait/raw/master/docs/pics/Terkait_image.png "Terkait on the New York Times website")

## Functionality
* Parsing of existing semantic annotations. (e.g., RDFa or microdata format)
* Intelligent algorithm to retrieve content of interest (COI) from a page.
* Send COI to semantic enhancement service (e.g., to an Apache Stanbol installation)
* Filter returned enhancements regarding relevance
* Visualize enhancements & presenting related content

## Features
* Extensible architecture to allow easy integration of CMS-specific services
* Semantic navigation of content

## Goals
* Provide automatic COI recognition
* Provide semantic automatic enhancement of COI
* Provide a playground to demonstrate VIE widgets 

Howto install Chrome extension:

(1) Download and install [Google Chrome](https://www.google.com/chrome/)
(2) Bring up the extensions management page by clicking the wrench icon and choosing Tools > Extensions.
(3) If Developer mode has a "+" by it, click the "+" to add developer information to the page. The "+" changes to a "-", and more buttons and information appear.
(4) Click the "Load unpacked extension" button. A file dialog appears.
(5) In the file dialog, navigate to your extension's folder (i.e., ".../terkait") and click OK.