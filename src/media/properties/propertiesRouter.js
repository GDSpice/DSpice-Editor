
/*
#-------------------------------------------------------------------------------
# Name:         descriptionElemSelect.js
# Author:       d.fathi
# Created:      18/07/2021
# Last update:   30/08/2026
# Copyright:   (c)  DSpice 2026
# Licence:     free
#-------------------------------------------------------------------------------
*/

//-----------------------------show element select to  panel----------------------------------------//


var mtable = {};
function showDescriptionElemSelectInPanel(select) {

       
 
        if (select) {
            mtable.select = select;
			
            switch (mtable.select.getAttribute("name")) {
            case "rect":
                rectSelect();
                break;

            case "ellipse":
                ellipseSelect();
                break;

            case "arc":
                arcSelect();
                break;

            case "pin":
                pinSelect();
                break;

			     case "ioparam":
			    ioparamSelect();
                break;

			case "image":
				imageSelect();
				break;

	         case 'analysis':
	            analysisSelect();
	            break;

			case 'codePy':
	           codePySelect(self);
	        break;

		 case 'codeHTML':
	 	   codeHTMLSelect();
	 	   break;

			case 'codeSpice':
				codeSpiceSelect();
				break;


			case "polyline":
                polylineSelect();
                break;

			case "polygon":
                polygonSelect();
                break;

			case "net":
                netSelect();
                break;

            case "part":
                partSelect();
                break;

            case "text":
			case ".param":
                textSelect();
                break;

            case "label":
                labelSelected();
                break;

            case "ref":
                refSelected();
                break;

            case "modelSpice":
                modelSelected();
                break;

			 case "param":
                paramSelected();
             break;

			 case "probe":
                probeSelect();
             break;

			 case "oscilloscope":
                oscilloscopeSelect();
             break;

            default:
                selectPage();

        


            }
        } else {
            pageSelect();
            return;
        }
}








function changeSelect() {



 switch (mtable.type) {
    case 'page':
        pageModified();
        break;

    case 'rect':
        modifiedRect();
        break;

    case 'ellipse':
        modifiedEllipse();
        break;

    case 'arc':
        modifiedArc();
        break;

	case 'image':
        modifiedImage(pos,e);
        break;


	case 'ioparam':
	     modifiedioparam();
		break;

    case 'pin':
        modifiedPin();
        break;

	case 'analysis':
	   modifiedAnalysis();
	   break;

	case 'codePy':
	   modifiedcodePy();
	   break;

	case 'codeHTML':
	 	  modifiedcodeHTML();
	 	  break;

	case 'codeSpice':
		   modifiedcodeSpice(pos,e);
		   break;

    case 'text':
	case '.param':
        modifiedText();
        break;

    case 'label':
        labelModified(pos,e);
        break;

	case 'polyline':
        polylineModified();
        break;

	case 'polygon':
        polygonModified();
        break;

	case 'part':
	      modifiedPart();
	      break;

	case 'net':
        netModified();
        break;

    case 'ref':
        refModified();
        break;
    
    case 'modelSpice':
        modelModified();
        break;

    case 'param':
        paramModified();
        break;

	case 'probe':
	      probeModified();
        break;

	case 'oscilloscope':
	      oscilloscopeModified();
        break;
    }
  // drawing.saveData('Changed property of ' + mtable.typeSelect);
}


