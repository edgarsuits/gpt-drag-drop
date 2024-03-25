var TUTOR_ID = null;
var LOG = [];
/**
 * This script initializes event handlers and other initial setup requirements once the DOM is fully loaded.
 * It ensures that the DOM elements are available before any JavaScript operations are attempted on them.
 */
$(document).ready(function (e) {
  let isSaved = 0;
  let trainID = 0;
  let item_count = 0;



  function buildHTMLFromCompactRepresentation(compactRep, componentName) {
  
    // Function to create an HTML string for an element with optional class, placeholder, and additional attributes
    function createElement(tag, className, placeholder, dataType, content = "") {
      let attributes = "";
      if (className) attributes += ` class="${className}"`;
      if (placeholder) attributes += ` placeholder="${placeholder}"`;
      if (dataType) {
        if (componentName) {
          attributes += ` data-type="${dataType}" draggable="true" type="button" id="galleryItem_${componentName}_${item_count++}"`;
        } else {
          attributes += ` data-type="${dataType}" draggable="true" type="button" id="newItem_${item_count++}"`;
        }
      }
      if (tag === "input") {
        attributes += ` style="border: none;box-shadow: none;text-align: center;"`;
      }
      return `<${tag}${attributes}>${content}</${tag}>`;
    }
  
    // Function to recursively process and generate HTML string from the compact representation
    function appendElementsFromCompactRep(compactString, isChild = false) {
      const regex = /(\w+)\[([^\]]+)\]|\w+\s*{/g;
      let match,
        html = "";
  
      while ((match = regex.exec(compactString)) !== null) {
        const [matchedString, type, content] = match;
        if (type && content) {
          switch (type) {
            case "title":
            case "label":
              const divClass =
              type === "title"
                  ? "btn-primary btn-tutor-title"
                  : "btn-success btn-label row";
              const dt =
                  type === "title"
                      ? "page-items"
                      : "page-row";
              const p = createElement("p", "page-item", null, null, content) + createElement("p", "removeFromDom", null, null, "Tutor Title")
              const q =  createElement("p", "page-item align-self-center", null, null, content) + createElement("p", "removeFromDom", null, null, "Label")
              const f = type === "title" ? p : q ;
              html += createElement(
                "div",
                `btn ${divClass} rounded-button`,
                null,
                dt,
                f
              );
              break;
            case "input":
              const input = createElement("input", "form-control", content, null);
              input.style = "border: none;box-shadow: none;text-align: center;";
              html += createElement(
                "div",
                "btn btn-light btn-input-box-t rounded-button",
                null,
                "page-row",
                input
              );
              break;
          }
        } else if (matchedString.trim().endsWith("{")) {
          const elementType = matchedString.trim().replace("{", "").trim();
          const divType = elementType === "row" ? "page-row" : "page-items";
          const divClass =
            elementType === "row"
              ? "btn-warning btn-row btn-row-item grid"
              : "btn-info btn-column";
          const pRemove = createElement(
            "p",
            "removeFromDom",
            null,
            null,
            elementType.charAt(0).toUpperCase() + elementType.slice(1)
          );
          const ulClass =
            elementType === "row"
              ? "list one page-item-ul grid grid-flow-col gap-1"
              : "list one d-flex flex-column gap-2 page-item-rl-row";
          const ulId =
            elementType === "row" ? "page-item-ul" : "page-item-rl-row";
          const closeIndex = findClosingIndex(compactString, regex.lastIndex);
          const innerContent = compactString.substring(
            regex.lastIndex,
            closeIndex
          );
          const ulContent = appendElementsFromCompactRep(innerContent, true);
          const ul = `<ul class="${ulClass}" data-type="page-row">${ulContent}</ul>`;
  
          html += createElement(
            "div",
            `btn ${divClass} drop-box rounded-button`,
            null,
            divType,
            pRemove + ul
          );
          regex.lastIndex = closeIndex + 1;
        }
      }
      if (isChild) {
        return html;
      } else {
        const pageDiv = createElement("div", null, null, "page-items", html);
        const finalContainerDiv = createElement(
          "div",
          "container mx-auto flex flex-col py-1 justify-center items-center",
          null,
          null,
          ""
        );
        return html + finalContainerDiv;
      }
    }
  
    function findClosingIndex(str, openIndex) {
      let stack = 1;
      for (let i = openIndex; i < str.length; i++) {
        if (str[i] === "{") stack++;
        else if (str[i] === "}") stack--;
  
        if (stack === 0) return i;
      }
      return -1; // Handle malformed strings gracefully
    }
    html = appendElementsFromCompactRep(compactRep)
    return html;
  }
/**
 * Initializes click event on the generate button.
 * Shows a loading spinner, captures the content of the textarea, and makes an AJAX POST request to generate a tutor layout.
 * On success, it converts the compact layout response to HTML and appends it to the page.
 * On error, it displays an alert message and hides the loading spinner.
 */
  $("#generate_btn").click(function () {
    $("#loadingSpinner").show();

    const textareaContent = $(".tutor-designer-input").val();
    // AJAX request to server to generate tutor layout
    $.ajax({
      url: "/generateTutorLayout", // Endpoint to generate layout
      type: "POST",
      data: JSON.stringify({ text: textareaContent }),
      contentType: "application/json",
      success: function (response) {
        // Use the response to display the generated tutor layout
        const compactLayout = response.compactLayout;
        // Assuming function to convert compact layout to HTML and append it to the page
        $("#page-container").html(
          buildHTMLFromCompactRepresentation(compactLayout, false)
        );
        // // Find the first .btn-column in the page
        // let btnColumn = $('.btn-column').first();

        // // Find the closest child of btnColumn with the class .list.one.d-flex.flex-column.gap-2
        // let listContainer = btnColumn.find('.list.one.d-flex.flex-column.gap-2').first();
        // var listcont = $('#page-item-rl-row').first();

        // if (listContainer.length > 0 && btnColumn.length > 0) {
        //     // Calculate the height of listContainer
        //     let contentHeight = listContainer[0].scrollHeight;
        //     // Set the height of the btnColumn based on the contentHeight + 100px for extra space
        //     btnColumn.css('height', `${contentHeight + 100}px`);
        //     listcont.css('height', `${contentHeight + 100}px`)
        // }

        $("#loadingSpinner").hide();
      },
      error: function (error) {
        console.error("Error generating tutor layout:", error);
        alert("Failed to generate tutor layout.");
        $("#loadingSpinner").hide();
      },
    });
  });
/**
 * Initializes click event on generate component buttons.
 * Shows a spinner overlay, captures the component name and input content, and makes an AJAX POST request to generate a component layout.
 * On success, it converts the compact layout response to HTML for the specific component.
 * On error, it displays an alert message and hides the spinner overlay.
 */
  $(document).on("click", ".generate_component_btn", function () {
    const $thisButton = $(this); // Capture the button that was clicked

    $thisButton.closest(".component-item").find(".spinner-overlay").show();
    const componentName = $thisButton
      .closest(".component-item")
      .find(".component-name")
      .text()
      .trim();
    const textareaContent = $thisButton
      .closest(".input-group")
      .find(".form-control")
      .val();
    // AJAX request to server to generate tutor layout
    $.ajax({
      url: "/generateComponentLayout", // Endpoint to generate layout
      type: "POST",
      data: JSON.stringify({ text: textareaContent }),
      contentType: "application/json",
      success: function (response) {
        // Use the response to display the generated tutor layout
        const compactLayout = response.compactLayout;
        // Find the component-details-content list related to the clicked button
        const $componentDetailsContent = $thisButton
          .closest(".component-item")
          .find(".component-details-content");
        // Assuming function to convert compact layout to HTML
        $componentDetailsContent.html(
          buildHTMLFromCompactRepresentation(compactLayout, componentName)
        );
        $thisButton.closest(".component-item").find(".spinner-overlay").hide();
      },
      error: function (error) {
        console.error("Error generating tutor layout:", error);
        alert("Failed to generate tutor layout.");
        $thisButton.closest(".component-item").find(".spinner-overlay").hide();
      },
    });
  });
/**
 * Handles click events on elements with the 'closeModal' class.
 * This function hides three specific modals: '#alertModal', '#SuccessModal', and '#TrainModal'.
 * It's designed to be attached to any closeModal button or link within the application.
 * The page reload line is commented out, but can be enabled if a fresh state is required after modal closure.
 */
  $(".closeModal").click(function () {
    $("#alertModal").modal("hide");
    $("#SuccessModal").modal("hide");
    $("#TrainModal").modal("hide");
    //  window.location.reload()
  });
/**
 * Attaches a click event handler to elements with the 'closeModal_not_reload' class.
 * When such an element is clicked, it hides the '#alertModal' and '#SuccessModal',
 * then smoothly scrolls the page back to the top.
 * This function is useful for closing modals without refreshing the page and ensuring
 * the user is returned to the start of the document, improving the UX after modal closure.
 */
  $(".closeModal_not_reload").click(function () {
    $("#alertModal").modal("hide");
    $("#SuccessModal").modal("hide");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
/**
 * Attaches a click event handler to the '#mytutor_rename' button.
 * This function retrieves the ID of the tutor from the first cell of the parent table row and
 * the new name of the tutor from the '#tutor_rename' input field. It then creates a log item
 * for this action and prepares the data for the POST request to the server's "/rename" endpoint.
 * Upon success, it displays a success modal to the user. Errors during the AJAX call are not
 * explicitly handled beyond default browser logging.
 */
  $("#mytutor_rename").click(function () {
    Id = $(this).parents("tr").find("td").eq(0).html();
    tutorName = $("#tutor_rename").val();
    var log_item = create_log_item(
      "Tutor Building",
      "Tutor",
      Id,
      "Tutor Rename",
      tutorName
    );
    var data = get_request_body(Id, tutorName, null, log_item);

    $.ajax({
      url: "/rename",
      // dataType: 'json',
      data: JSON.stringify(data),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        $("#SuccessModal").modal("show");
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });
/**
 * Attaches a click event listener to the button with the ID `btn_update_tutor`.
 * When triggered, it performs the following actions:
 * 1. Retrieves the current HTML content of the element with the ID `page`.
 * 2. Captures the text of the first paragraph element within an element having both `btn-tutor-title` and `page-item` classes, assumed to be the tutor's name.
 * 3. Constructs an object containing both the retrieved content and tutor name.
 * 4. Sends this object as a JSON string in a POST request to the server endpoint `/update_tutor_content`.
 *    - On successful request completion, it displays the `#SuccessModal` to indicate the update was successful.
 *    - If the request fails, the error handling is currently minimal and may be expanded as needed.
 *
 * This implementation assumes that the server endpoint correctly handles the data to update the tutor content.
 */
  $("#btn_update_tutor").click(function () {
    var content = $("#page").html();

    var tutorName = $(".btn-tutor-title p.page-item").text();

    var content = {
      content: content,
      tutorName: tutorName,
    };

    $.ajax({
      url: "/update_tutor_content",
      data: JSON.stringify(content),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        //console.log("response", JSON.stringify(content));
        $("#SuccessModal").modal("show");
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });
/**
 * Attaches a click event listener to elements with the class `mytutor_upload`.
 * Upon clicking, the listener performs the following operations:
 * 1. Retrieves the ID of the tutor from the first table cell (`<td>`) of the parent row (`<tr>`). This ID uniquely identifies the tutor.
 * 2. Constructs an object with `IsOnline` set to `1` and `id` set to the retrieved tutor ID. This object signifies the intent to update the tutor's online status to true.
 * 3. Sends this object as JSON in a POST request to the `/update_tutor_online` server endpoint.
 *    - If the request is successful, it shows the `#SuccessModal`, signaling the update was successful.
 *    - In case of an error, the handling is minimal, but could be extended to provide more feedback.
 *
 * This mechanism allows for the dynamic updating of a tutor's online status without requiring a page reload.
 */

  $(".mytutor_upload").click(function () {
    Id = $(this).parents("tr").find("td").eq(0).html();

    var content = {
      IsOnline: 1,
      id: Id,
    };

    $.ajax({
      url: "/update_tutor_online",
      data: JSON.stringify(content),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        //console.log("response", JSON.stringify(content));
        $("#SuccessModal").modal("show");
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });
/**
 * Attaches a click event listener to elements with the class `browse_tutor_unupload_online`.
 * This listener executes the following actions upon being triggered:
 * 1. Extracts the ID of a tutor from the first table cell (`<td>`) in the parent row (`<tr>`), which is used to uniquely identify the tutor.
 * 2. Creates an object with `IsOnline` set to `0` and `id` to the extracted tutor ID, indicating the intention to update the tutor's online status to offline.
 * 3. Initiates a POST request to the `/update_tutor_online` server endpoint, sending the created object as a JSON payload.
 *    - On successful completion of the request, it displays the `#SuccessModal`, signifying that the tutor's status has been successfully updated to offline.
 *    - Should there be an error with the request, the current implementation does not provide explicit error handling, but it could be implemented to enhance user feedback.
 *
 * This approach facilitates the dynamic management of a tutor's online status directly from the client interface without needing to refresh the page.
 */
  $(".browse_tutor_unupload_online").click(function () {
    Id = $(this).parents("tr").find("td").eq(0).html();

    var content = {
      IsOnline: 0,
      id: Id,
    };

    $.ajax({
      url: "/update_tutor_online",
      data: JSON.stringify(content),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        //console.log("response", JSON.stringify(content));
        $("#SuccessModal").modal("show");
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });
/**
 * Attaches a click event listener to elements with the class `btn_save_online_follow`.
 * This function increments the follow count for a specific tutor and updates it on the server:
 * 1. Retrieves the tutor's unique ID from the first table cell (`<td>`) within the same row (`<tr>`) as the clicked button.
 * 2. Extracts the current number of follows from the fifth table cell (`<td>`) in the same row, converts it to an integer, and increments it by 1.
 * 3. Constructs an object containing the updated number of follows and the tutor's ID.
 * 4. Sends this object as a JSON string in a POST request to the `/update_tutor_follow_online` endpoint.
 *    - If the request is successful, it displays the `#SuccessModal`, indicating the follow count was successfully updated.
 *    - If the request encounters an error, the current implementation does not explicitly handle it, but this could be expanded to improve user experience.
 *
 * This process allows for real-time updates to the tutor's follow count without requiring a page reload.
 */
  $(".btn_save_online_follow").click(function () {
    Id = $(this).parents("tr").find("td").eq(0).html();
    follows = parseInt($(this).parents("tr").find("td").eq(4).text());
    var content = {
      follows: follows + 1,
      id: Id,
    };

    $.ajax({
      url: "/update_tutor_follow_online",
      data: JSON.stringify(content),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        //console.log("response", JSON.stringify(content));
        $("#SuccessModal").modal("show");
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });
/**
 * Attaches a click event listener to the element with the ID `mytutor_delete`.
 * This function facilitates the deletion of a tutor's record from the server:
 * 1. Determines the tutor's unique ID by extracting the content of the first table cell (`<td>`) in the closest row (`<tr>`) to the clicked button. This ID is critical for identifying which tutor record to delete.
 * 2. Forms an object with the tutor's ID, preparing it for transmission to the server.
 * 3. Executes a POST request to the `/delete` endpoint, sending the tutor's ID as a JSON string.
 *    - On successful deletion (as indicated by the server's response), it displays the `#SuccessModal`, notifying the user of the successful operation.
 *    - In case of an error during the request (e.g., server-side issues, network problems), the current setup does not explicitly handle such errors, but developers could implement error handling mechanisms to enhance user feedback and experience.
 *
 * This method allows for the dynamic removal of tutor records without the need to reload the webpage, streamlining the user experience in managing tutor information.
 */
  $("#mytutor_delete").click(function (event) {
    Id = $(this).closest("tr").find("td").eq(0).html();

    var data = {
      Id: Id,
    };

    $.ajax({
      url: "/delete",
      // dataType: 'json',
      data: JSON.stringify(data),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        $("#SuccessModal").modal("show");
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });

  allNames = [];
  selectedElements = [];

  var count = 0;
/**
 * Attaches a click event listener to the element with the ID `tutor_reset`.
 * Upon clicking, this function performs a simple operation:
 * 1. It changes the current location of the browser to the `/tutor_builder` URL, effectively redirecting the user to the tutor builder page.
 * 
 * This approach is used to reset the current state or data in the tutor builder interface by navigating the user away from the current page and then back to the tutor builder page, providing a fresh start without requiring manual page refreshes or data clearing by the user.
 */
  $("#tutor_reset").click(function () {
    $(location).attr("href", "/tutor_builder");
  });
/**
 * Attaches a click event listener to elements with the class `mytutor_edit`.
 * This function is designed to facilitate the editing of a tutor's information:
 * 1. Retrieves the unique ID of the tutor from the first table cell (`<td>`) within the same row (`<tr>`) as the clicked button. This ID is essential for identifying which tutor record to edit.
 * 2. Packages this ID into an object for transmission.
 * 3. Initiates a POST request to the `/tutor_edit` endpoint with the tutor's ID as a JSON payload.
 *    - On successful response, the browser is redirected to the `/edit` page, intended for editing tutor information. Additionally, the response presumed to contain the tutor's editable data (`response.tutor`) is stored in the browser's local storage under the key `content` and the page content is replaced with the received data.
 *    - If the request fails, error handling is not explicitly detailed here, but could involve displaying a message to the user or logging the error for debugging purposes.
 *
 * Note: This function assumes the server responds with a JSON object containing the tutor's data necessary for editing. The operation to replace the page content (`$("#page").replaceWith(result);`) suggests an immediate display of the tutor's information for editing, although this action seems redundant given the preceding redirection to `/edit`.
 */
  $(".mytutor_edit").click(function () {
    Id = $(this).parents("tr").find("td").eq(0).html();

    var data = {
      Id: Id,
    };

    $.ajax({
      url: "/tutor_edit",
      dataType: "json",
      data: JSON.stringify(data),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        window.location.href = "/edit";

        var result = response.tutor;

        localStorage.setItem("content", result);

        //console.log( $('#page').html())
        $("#page").replaceWith(result);
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });
/**
 * Attaches a click event listener to elements with the class `mytutor_preview`.
 * This listener is responsible for fetching a preview of a specific tutor's content based on their ID:
 * 1. Retrieves the tutor's ID by finding the first table cell (`<td>`) content in the same row (`<tr>`) as the clicked button. The ID is essential for identifying which tutor's preview to fetch.
 * 2. Packages the tutor's ID into an object to be sent to the server.
 * 3. Initiates a POST request to the `/tutor_preview` endpoint with the tutor's ID as the payload.
 *    - If the request is successful, the browser is redirected to the `/preview` URL to show the fetched tutor's content.
 *    - As part of the success callback, the tutor's content received from the server (assumed to be in the `response.tutor`) is stored in `localStorage` under the key `content`. This stored content could be used in the preview page to display the tutor's information.
 *    - Additionally, the current content of the element with the ID `page` is replaced with the fetched tutor's content, allowing for immediate preview if the redirection does not happen for some reason.
 *    - In case of an error during the AJAX request, the error handling is currently minimal but could be enhanced to provide feedback to the user.
 *
 * This mechanism enables dynamic previewing of tutor content without the need for page reloads, offering a more seamless user experience.
 */
  $(".mytutor_preview").click(function () {
    Id = $(this).parents("tr").find("td").eq(0).html();

    var data = {
      Id: Id,
    };

    $.ajax({
      url: "/tutor_preview",
      dataType: "json",
      data: JSON.stringify(data),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        window.location.href = "/preview";

        var result = response.tutor;

        localStorage.setItem("content", result);

        //console.log( $('#page').html())
        $("#page").replaceWith(result);
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });
/**
 * Attaches a click event listener to elements with the class `mytutor_train`.
 * This function initiates a training process for a specific tutor by performing the following steps:
 * 1. Retrieves the ID of the tutor from the first table cell (`<td>`) within the same row (`<tr>`) as the clicked element. This ID uniquely identifies the tutor for which the training is to be initiated.
 * 2. Forms a data object containing the tutor's ID, which is sent to the server to specify which tutor is to undergo training.
 * 3. Sends an AJAX POST request to the `/tutor_train` endpoint, passing the tutor's ID as JSON.
 *    - Upon successful completion of the request, the function redirects the browser to the `/train` URL. This page is intended to show the status or result of the training process.
 *    - The response from the server is expected to include the trained tutor's content (`response.tutor`) and a unique identifier for the tutor (`response.tutor_id`). Both pieces of information are stored in `localStorage` for use on the training status/result page.
 *    - The content of the element with the ID `page` is replaced with the tutor's content provided in the response, allowing the user to see an immediate preview or result of the training if needed.
 *    - If the request fails due to server error or network issues, the error handling currently does not provide specific feedback but could be implemented to alert the user to the issue.
 *
 * This interactive functionality enhances the user experience by enabling on-the-fly training of tutors without the need for manual page refreshes or navigation.
 */
  $(".mytutor_train").click(function () {
    //console.log("This is train function!!!!!");

    Id = $(this).parents("tr").find("td").eq(0).html();

    var data = {
      Id: Id,
    };

    $.ajax({
      url: "/tutor_train",
      dataType: "json",
      data: JSON.stringify(data),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        window.location.href = "/train";

        localStorage.setItem("content", response.tutor);
        localStorage.setItem("tutor_id", response.tutor_id);

        //console.log( $('#page').html())
        $("#page").replaceWith(response.tutor);
      },
      error: function (error) {
        //console.log(error);
      },
    });
  });
/**
 * Saves the current tutor's information to the server. It captures the tutor's ID, content from a specified container, 
 * and the tutor's name from a specific location within the document. It constructs a data object to send to the server,
 * including handling cases where the tutor's name might be empty or might already exist in the `tutorNames` array.
 * 
 * If the tutor's name is empty, an alert modal is shown. If the tutor's name is unique (not found in the `tutorNames` array),
 * it proceeds to save the tutor's information via a POST request. If the name already exists within the array, a modal
 * indicating a duplicate name is shown. Upon successful save, a success modal is displayed, the global log is cleared, 
 * a saved flag is set, and the ID returned from the server is stored.
 * 
 * This function assumes the presence of global variables or elements like `LOG`, `isSaved`, `trainID`, and `tutorNames`,
 * as well as the function `get_request_body` for constructing the request payload.
 */
  function save_tutor() {
    Id = $(this).parents("tr").find("td").eq(0).html();
    var content = $("#page_parent").html();
    var tutorName = $(".btn-tutor-title p.page-item").text();

    var data = get_request_body(null, tutorName, content, LOG);
    console.log(data);

    if (tutorName.trim() === "") {
      $("#alertModal").modal("show");
    } else {
      if (tutorNames.length === 0) {
        $.ajax({
          url: "/save",
          // dataType: 'json',
          data: JSON.stringify(data),
          type: "POST",
          contentType: "application/json",
          success: function (response) {
            //console.log("response", JSON.stringify(data));
            $("#SuccessModal").modal("show");
            LOG = [];
            isSaved = 1;
            //console.log(response.id);
            trainID = response.id;
          },
          error: function (error) {
            //console.log(error);
          },
        });
      } else {
        for (var j = 0; j < tutorNames.length; j++) {
          if (tutorNames[j] === tutorName) {
            $("#exampleModal").modal("show");
            break;
          } else if (
            j === tutorNames.length - 1 &&
            tutorNames[tutorNames.length - 1] !== tutorName
          ) {
            $.ajax({
              url: "/save",
              // dataType: 'json',
              data: JSON.stringify(data),
              type: "POST",
              contentType: "application/json",
              success: function (response) {
                //console.log("response", JSON.stringify(data));
                $("#SuccessModal").modal("show");
                LOG = [];
                //console.log(response.id);
                isSaved = 1;
                trainID = response.id;
              },
              error: function (error) {
                //console.log(error);
              },
            });
          }
        }
      }
    }
  }

  $("#btn_save_tutor").click(function () {
    Id = $(this).parents("tr").find("td").eq(0).html();
    var content = $("#page_parent").html();
    var tutorName = $(".btn-tutor-title p.page-item").text();

    var data = get_request_body(null, tutorName, content, LOG);
    console.log(data);

    $.ajax({
      url: "/save",
      // dataType: 'json',
      data: JSON.stringify(data),
      type: "POST",
      contentType: "application/json",
      success: function (response) {
        //console.log("response", JSON.stringify(data));
        $("#SuccessModal").modal("show");
        LOG = [];
        // $(location).attr('href','/tutor_builder');
      },
      error: function (error) {
        //console.log(error);
      },
    });

    // window.location.reload();
  });
/**
 * Checks if the "page-container" element is empty or not.
 * Specifically, it looks for the presence of any `<div>` elements within "page-container".
 * @returns {boolean} True if "page-container" does not contain any `<div>` elements, indicating it is empty. Otherwise, false.
 */
  function isEmptyTutor() {
    inner = document.getElementById("page-container");
    //console.log(inner.innerHTML);
    if (!inner.innerHTML.includes("div")) {
      return true;
    } else {
      return false;
    }
  }

  $("#btn_myTutors").click(function () {
    if (isEmptyTutor()) {
      $("#confirmModal").data("page", "/my_tutors");
      window.location.href = $("#confirmModal").data("page");
    } else {
      if (isSaved == 0) {
        $("#confirmModal").modal("show");
      } else {
        $("#confirmModal").data("page", "/my_tutors");
        window.location.href = $("#confirmModal").data("page");
      }
    }
  });

  $("#btn_home").click(function () {
    if (isEmptyTutor()) {
      $("#confirmModal").data("page", "/home");
      window.location.href = $("#confirmModal").data("page");
    } else {
      if (isSaved == 0) {
        $("#confirmModal").modal("show");
      } else {
        $("#confirmModal").data("page", "/home");
        window.location.href = $("#confirmModal").data("page");
      }
    }
  });

  $("#btn_browserTutors").click(function () {
    if (isEmptyTutor()) {
      $("#confirmModal").data("page", "/browse_tutors");
      window.location.href = $("#confirmModal").data("page");
    } else {
      if (isSaved == 0) {
        $("#confirmModal").modal("show");
      } else {
        $("#confirmModal").data("page", "/browse_tutors");
        window.location.href = $("#confirmModal").data("page");
      }
    }
  });

  $("#btn_myProfile").click(function () {
    if (isEmptyTutor()) {
      $("#confirmModal").data("page", "/profile");
      window.location.href = $("#confirmModal").data("page");
    } else {
      if (isSaved == 0) {
        $("#confirmModal").modal("show");
      } else {
        $("#confirmModal").data("page", "/profile");
        window.location.href = $("#confirmModal").data("page");
      }
    }
  });

  $("#btn_cancel").click(function () {
    $("#confirmModal").modal("hide");
  });

  $("#btn_save_tutor_header").click(function () {
    save_tutor();
    var a = $("#confirmModal").data("page");
    //console.log(a);
    window.location.href = $("#confirmModal").data("page");
  });

  $("#save_tutor").click(function () {
    save_tutor();
  });

  $("#train_tutor").click(function () {
    if (isSaved == 0) {
      $("#TrainModal").modal("show");
    } else {
      if (trainID == 0 || trainID == null) {
      } else {
        Id = $(this).parents("tr").find("td").eq(0).html();

        var data = {
          Id: trainID,
        };

        $.ajax({
          url: "/tutor_train",
          dataType: "json",
          data: JSON.stringify(data),
          type: "POST",
          contentType: "application/json",
          success: function (response) {
            //console.log("response=========", JSON.stringify(response));
            window.location.href = "/train";

            localStorage.setItem("content", response.tutor);
            localStorage.setItem("tutor_id", response.tutor_id);

            //console.log( $('#page').html())
            $("#page").replaceWith(response.tutor);
          },
          error: function (error) {
            //console.log(error);
          },
        });
      }
    }
  });

  $("#preview_tutor").click(function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    document.getElementById("drag_drop").style.display = "none";

    $("#title-font").text("Preview Tutor");
    $("#title-font").css("color", "#0d6efd");

    if ($("#btn_back_edit").length > 0) {
      //console.log("already exist!!!");
    } else {
      $("#tutor-title").append(
        '<button class="btn btn-dark" style="margin-top: 8px;" id="btn_back_edit">Back To Tutor Edit Mode</button>'
      );
    }

    //console.log("This is preview_tutor");

    var str = $(".list p.page-item").text();

    //console.log("str", str);

    $(".list p.page-item").each(function () {
      // For each element
      if ($(this).text().trim() === "")
        // $(this).remove(); // if it is empty, it removes it
        $(this).replaceWith(
          $(
            '<input style = "width: 100%; height: 100%; border: none!important; background: none;" class="page-item">' +
              "</input>"
          )
        );
    });

    $("#btn_back_edit").click(function () {
      //console.log("This is edit mode!!!!!!!");
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      document.getElementById("drag_drop").style.display = "block";
      $("#title-font").text("Tutor Builder");
      $("#title-font").css("color", "black");

      $(".list input.page-item").replaceWith(
        $('<p class="page-item" id = "page-item">' + "</p>")
      );

      $("#btn_back_edit").remove();
    });
  });

  const CLASS_NAMES = {
    // guideLine: "__sortable_draggable-guide-line"
  };
  const containerStack = [];

  let dragItem;
  let copyItem;

  let dropTarget;
  let copyTarget;

  let sourceContainer;
  let data = null;
  let EditItem;
  let copyMode = false;

  // Initialize the dictionary to store item counts
  var componentCounts = { "Component 1": 0 };
/**
 * Increments the count of a specific component within a global dictionary (`componentCounts`).
 * If the component is not already present in the dictionary, it is added with an initial count of 1.
 * This function is useful for tracking the usage or occurrence of various components within an application.
 *
 * @param {string} componentName - The name of the component to be incremented in the count.
 */
  function incrementComponentCount(componentName) {
    // If the component is already in the dictionary, increment its count
    if (componentCounts.hasOwnProperty(componentName)) {
      componentCounts[componentName]++;
    } else {
      // Otherwise, add the component to the dictionary with an initial count of 1
      componentCounts[componentName] = 1;
    }
  }

  let dummyElement = document.createElement("div");
  dummyElement.className += "dummy";

  class Dragoned {
    constructor(container, options = {}) {
      if (typeof container === "string") {
        container = document.querySelector(container);
      }
      if (!container || !container instanceof HTMLElement) {
        return new Error(
          "Dragoned: container must be a string or an HTMLElement"
        );
      }
      this.dragOverHandler = this.dragOverHandler.bind(this);
      this.container = container;
      this.moveY = 0;
      this.moveX = 0;
      this.mouseUp = false;
      this.optionsInit(options);
      containerStack.push(this);
      this.init();
    }

    optionsInit(options) {
      this.options = {
        draggable: options.draggable,
        handle: options.handle,
        delay: typeof options.delay === "number" ? options.delay : 0,
        preventDefault: options.preventDefault,
        direction: options.direction,
        onStart: options.onStart,
        onMove: options.onMove,
        onClone: options.onClone,
        onEnd: options.onEnd,
        body: options.body || document.body,
        clone: options.clone,
        group: options.group,
        sort: options.sort,
      };
    }

    init() {
      this.bindDrag(this.container);
    }

    bindDrag(container) {
      container.style.userSelect = "none";
      container.addEventListener("dragover", this.dragOverHandler);
    }

    dragOverHandler(event) {
      event.preventDefault();

      if (
        event.target.nodeName == "UL" &&
        event.target.dataset.type === dragItem.dataset.type
      ) {
        dummyElement.classList.add("dummy");
        //event.target.append(dummyElement);
        dropTarget = event.target;
      } else {
        // dropTarget = null;
        // $('.dummy').remove();
        // event.target.removeChild(dummyElement);
        dragItem.classList.remove("active");
      }
    }
  }

  class Dragoned_Component {
    constructor(container, options = {}) {
      if (typeof container === "string") {
        container = document.querySelector(container);
      }
      if (!container || !container instanceof HTMLElement) {
        return new Error(
          "Dragoned: container must be a string or an HTMLElement"
        );
      }
      this.dragOverHandler = this.dragOverHandler.bind(this);
      this.copyOverHandler = this.copyOverHandler.bind(this);

      this.container = container;
      this.moveY = 0;
      this.moveX = 0;
      this.mouseUp = false;
      this.optionsInit(options);
      containerStack.push(this);
      this.init();
    }
    optionsInit(options) {
      this.options = {
        draggable: options.draggable,
        handle: options.handle,
        delay: typeof options.delay === "number" ? options.delay : 0,
        preventDefault: options.preventDefault,
        direction: options.direction,
        onStart: options.onStart,
        onMove: options.onMove,
        onClone: options.onClone,
        onEnd: options.onEnd,
        body: options.body || document.body,
        clone: options.clone,
        group: options.group,
        sort: options.sort,
      };
    }

    init() {
      this.bindDrag(this.container);
    }

    bindDrag(container) {
      container.style.userSelect = "none";
      container.addEventListener("dragover", this.dragOverHandler);
      container.addEventListener('mouseover',  this.copyOverHandler)
    }

    copyOverHandler(event) {
      event.preventDefault();
      if (!copyMode) return;

      // Determine if the current drag over event target matches the conditions
      if (
        (event.target.nodeName === "UL" &&
          event.target.dataset.type === copyItem.dataset.type) ||
        (event.target.classList.contains("page-item-ul") &&
        copyItem.classList.contains("btn-column")) ||
        (event.target.id === "page-container" && copyItem.classList.contains("btn-row")) ||
        (event.target.classList.contains("component-details-content") &&
          (copyItem.id === "row-item" || copyItem.id === "column-item")) ||
        (event.target.id === "page-container" &&
        copyItem.id.startsWith("galleryItem_"))
      ) {
        let targetContainer = event.target;
  
        // Determine the correct container for inserting the dummyElement
        if (
          targetContainer.id === "page-container" &&
          copyItem.classList.contains("btn-row")
        ) {
          targetContainer = document.querySelector("#page-container");
        } else if (
          targetContainer.classList.contains("component-details-content")
        ) {
          targetContainer = event.target;
        }
  
        let insertBeforeElement = null;
        // Get the list of all child elements within the target container
        const listItems = Array.from(targetContainer.children);
        if  (targetContainer.classList.contains("page-item-rl-row")) {
        // Find the child element to insert the dummy element before
        for (const item of listItems) {
          const rect = item.getBoundingClientRect();
          const halfwayPoint = rect.y + rect.height / 2;
  
          // Check if the mouse pointer is above the halfway point of the child element
          if (event.clientY < halfwayPoint) {
            insertBeforeElement = item;
            break;
          }
        } }
      else if  (targetContainer.classList.contains("page-item-ul")){
        for (const item of listItems) {
          const rect = item.getBoundingClientRect();
          const halfwayPoint = rect.x + rect.width / 2; // Change to calculate the horizontal halfway point
        
          // Check if the mouse pointer is to the left of the halfway point of the child element
          if (event.clientX < halfwayPoint) {
            insertBeforeElement = item;
            break; // Found the target item, stop looping
          }
        }}
  
        // Add the dummy element class
        dummyElement.classList.add("dummy");
  
        // Insert the dummy element at the determined position
        if (insertBeforeElement) {
          targetContainer.insertBefore(dummyElement, insertBeforeElement);
        } else {
          // If no insertBeforeElement is found (e.g., dragging below all items), append to the end
          targetContainer.appendChild(dummyElement);
        }
  
        copyTarget = targetContainer;
      } else {
        // If the drag over target doesn't match any of the specified conditions
      }
    }
    dragOverHandler(event) {
      event.preventDefault();

      // Determine if the current drag over event target matches the conditions
      if (
        (event.target.nodeName === "UL" &&
          event.target.dataset.type === dragItem.dataset.type) ||
        (event.target.classList.contains("page-item-ul") &&
          dragItem.classList.contains("btn-column")) ||
        (event.target.id === "page-container" && dragItem.classList.contains("btn-row")) ||
        (event.target.classList.contains("component-details-content") &&
          (dragItem.id === "row-item" || dragItem.id === "column-item")) ||
        (event.target.id === "page-container" &&
          dragItem.id.startsWith("galleryItem_"))
      ) {
        let targetContainer = event.target;

        // Determine the correct container for inserting the dummyElement
        if (
          targetContainer.id === "page-container" &&
          dragItem.classList.contains("btn-row")
        ) {
          targetContainer = document.querySelector("#page-container");
        } else if (
          targetContainer.classList.contains("component-details-content")
        ) {
          targetContainer = event.target;
        }

        let insertBeforeElement = null;
        // Get the list of all child elements within the target container
        const listItems = Array.from(targetContainer.children);
        if  (targetContainer.classList.contains("page-item-rl-row")) {
        // Find the child element to insert the dummy element before
        for (const item of listItems) {
          const rect = item.getBoundingClientRect();
          const halfwayPoint = rect.y + rect.height / 2;

          // Check if the mouse pointer is above the halfway point of the child element
          if (event.clientY < halfwayPoint) {
            insertBeforeElement = item;
            break;
          }
        } }
      else if  (targetContainer.classList.contains("page-item-ul")){
        for (const item of listItems) {
          const rect = item.getBoundingClientRect();
          const halfwayPoint = rect.x + rect.width / 2; // Change to calculate the horizontal halfway point
        
          // Check if the mouse pointer is to the left of the halfway point of the child element
          if (event.clientX < halfwayPoint) {
            insertBeforeElement = item;
            break; // Found the target item, stop looping
          }
        }}

        // Add the dummy element class
        dummyElement.classList.add("dummy");

        // Insert the dummy element at the determined position
        if (insertBeforeElement) {
          targetContainer.insertBefore(dummyElement, insertBeforeElement);
        } else {
          // If no insertBeforeElement is found (e.g., dragging below all items), append to the end
          targetContainer.appendChild(dummyElement);
        }

        dropTarget = targetContainer;
      } else {
        // If the drag over target doesn't match any of the specified conditions
        dragItem.classList.remove("active");
      }
    }


  }





  window.addEventListener("DOMContentLoaded", (event) => {
    (function () {


      document.addEventListener("dblclick", function(e) {
        // Check if the clicked target is a component name or a page item
        if (e.target.classList.contains("component-name") || e.target.classList.contains("page-item")) {
          // Make the target content editable and focus on it for immediate editing
          e.target.contentEditable = true;
          e.target.focus();
    
          // Add a one-time event listener for blur to handle when the editing is finished
          e.target.addEventListener("blur", function handler() {
            // Assuming the logic to determine and update the correct element goes here
            // Example: Update the element's innerHTML with the new text
            e.target.innerText = e.target.innerText; // Simplified; adapt as needed
    
            // Disable contentEditable
            e.target.contentEditable = false;
            // Remove this blur event listener after it's executed
            e.target.removeEventListener("blur", handler);
          }, {once: true}); // The listener is removed after execution thanks to {once: true}
        }
      });

      document.addEventListener("dragstart", dragStartHandler, false);
      document.addEventListener("dragend", dragEndHandler, false);
      document.addEventListener("drop", dropHandler, false);
      document
        .getElementById("page")
        .addEventListener("click", onClickHandler, false);
      // Select all elements with the 'component-details-container' class
      document
        .querySelectorAll(".component-details-container")
        .forEach((container) => {
          container.addEventListener("click", onClickHandler, false);
        });
      document.getElementById("redo").addEventListener("click", redo, false);
      document.getElementById("undo").addEventListener("click", undo, false);
      document
        .getElementById("Component-Id")
        .addEventListener("keyup", changeIDHandler, false);
      document
        .getElementById("Component-Value")
        .addEventListener("keyup", changeComponentValue, false);
      document
        .getElementById("input-box")
        .addEventListener("keyup", changeInputValue, false);
      // For logging
      document
        .getElementById("Component-Id")
        .addEventListener("change", changeIDHandlerLog, false);
      document
        .getElementById("Component-Value")
        .addEventListener("change", changeComponentValueLog, false);
      document
        .getElementById("input-box")
        .addEventListener("change", changeInputValueLog, false);
      // Event listeners for the buttons
      document.getElementById("show-td").addEventListener("click", function () {
        toggleSection("show-td", "ai-tutor-designer");
      });
      document.getElementById("show-cg").addEventListener("click", function () {
        toggleSection("show-cg", "components-gallery"); // Use the actual ID for the Components Gallery section
      });
      document.getElementById("show-dd").addEventListener("click", function () {
        toggleSection("show-dd", "drag-drop-section"); // Use the actual ID for the Drag and Drop section
      });
      document.getElementById("show-ed").addEventListener("click", function () {
        toggleSection("show-ed", "editor-section"); // Use the actual ID for the Editor section
      });

      // Initialize sections to be visible or hidden
      document.getElementById("ai-tutor-designer").style.display = "block"; // Default to showing the designer
      // Initialize other sections similarly with their respective IDs
      // document.getElementById('components-gallery').style.display = 'none';
      // document.getElementById('drag-drop-section').style.display = 'none';
      // document.getElementById('editor-section').style.display = 'none';

      document
        .getElementById("delete_btn")
        .addEventListener("click", deleteComponentHandler, false);
      const componentsList = document.getElementById("components-list");

      // Function to toggle component details
      componentsList.addEventListener("click", function (e) {
        if (
          e.target.classList.contains("component-header") ||
          e.target.classList.contains("arrow-toggle")
        ) {
          const header = e.target.classList.contains("component-header")
            ? e.target
            : e.target.closest(".component-header");
          const details = header.nextElementSibling;
          const isVisible = details.style.display === "block";
          details.style.display = isVisible ? "none" : "block";
          header.querySelector(".arrow-toggle").textContent = isVisible
            ? "▼"
            : "▲";
        }
      });

      // Double-click to rename component
      componentsList.addEventListener("dblclick", function (e) {
        if (e.target.classList.contains("component-name")) {
          e.target.contentEditable = true;
          e.target.focus();
        }
      });

      // Event listener for when the renaming is done (on blur)
      componentsList.addEventListener(
        "blur",
        function (e) {
          if (
            e.target.classList.contains("component-name") &&
            e.target.contentEditable === "true"
          ) {
            const oldName = e.target.dataset.oldName;
            const newName = e.target.textContent.trim();

            // Update the dictionary with the new name
            updateComponentNameInDictionary(oldName, newName);

            // Update the id of the details container
            let detailsContainer = e.target
              .closest(".component-item")
              .querySelector(".component-details-container");
            if (detailsContainer) {
              detailsContainer.id = `${newName}-details-container`;
            }

            // Find and rename gallery item ids
            let galleryItems = detailsContainer.querySelectorAll(
              `[id^='galleryItem_${oldName.trim()}']`
            );
            galleryItems.forEach((item) => {
              let parts = item.id.split("_");
              if (parts.length === 3) {
                parts[1] = newName; // Replace the old component name with the new one
                item.id = parts.join("_"); // Join the parts back together
              }
            });

            e.target.contentEditable = false;
            delete e.target.dataset.oldName; // Clean up
          }
        },
        true
      );
      let history = [document.querySelector("#page-container").innerHTML]; // This will store the states
      let currentStateIndex = 0; // This will track the current state

      function applyState(state) {
        // Apply your state (e.g., update the DOM with the state content)
        const pageContainer = document.querySelector("#page-container");
        pageContainer.innerHTML = state; // Assuming state is the innerHTML content of page-container
      }

      function makeChange() {
        const newState = document.querySelector("#page-container").innerHTML;

        // Keep only the last 20 states
        while (history.length > 20) {
          history.shift();
        }

        // Truncate any future states if we're in the middle of the history
        if (currentStateIndex < history.length - 1) {
          history = history.slice(0, currentStateIndex + 1);
        }

        // Add the new state to the history and apply it
        history.push(newState);
        currentStateIndex++;
        applyState(newState);
      }

      function undo() {
        if (currentStateIndex > 0) {
          currentStateIndex--;
          applyState(history[currentStateIndex]);
        } else {
          console.log("No more states to undo");
        }
      }

      function redo() {
        if (currentStateIndex < history.length - 1) {
          currentStateIndex++;
          applyState(history[currentStateIndex]);
        } else {
          console.log("No more states to redo");
        }
      }

      // Example usage:
      // Call makeChange() whenever there's a change to the #page-container you want to save.

      // Call undo() and redo() when you want to navigate through the saved states.

      let lastBackspaceTime = 0;
      const doubleBackspaceThreshold = 500; // Time in milliseconds for double press

      // Function to handle the actual deletion logic
      function handleDoubleBackspaceAction(event) {
        deleteComponentHandler(event);
      }


      function cleanSelected(){
        if (selectedElements.length>0) {
          for (var i = 0; i < selectedElements.length; i++) {
            // //console.log("for loop!!!", allNames.length);
            selectedElements[i].classList.remove("clicked")
            }
            selectedElements.splice(0, selectedElements.length);


        }
      }

      document.addEventListener("keydown", function (event) {
const key = event.key;
const currentTime = Date.now();
const target = event.target; // Directly work with the event target
const targetTagName = target.tagName.toLowerCase();
const isContentEditable = target.isContentEditable; // Check if the target is contentEditable

// Check if the pressed key is backspace and the focus is not on input/textarea, and also not on a contentEditable element
if (
  key === "Backspace" &&
  !["input", "textarea"].includes(targetTagName) &&
  !isContentEditable // Ensure it's not a contentEditable element
) {
  // Check if the current press is within the threshold of the last press
  if (currentTime - lastBackspaceTime <= doubleBackspaceThreshold) {
    // Prevent the default backspace action
    event.preventDefault();
    // Handle the double backspace action
    handleDoubleBackspaceAction();
  }
  // Update the lastBackspaceTime to the current time
  lastBackspaceTime = currentTime;
}

      
      
        if (key === 'Escape') {
          toggleCopyMode(false)
          //enableHoverFeedback() 
          if (dummyElement && dummyElement.parentNode) {
            dummyElement.parentNode.removeChild(dummyElement);
          }
          
          cleanSelected()

          }
        
          if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
            console.log(selectedElements.length)
            if (selectedElements.length==1){

            copyItem  = selectedElements[0]
            toggleCopyMode(true)}

                        // Optional: Provide visual feedback that copy mode is activated
        }


        }
      
      
      );



      // Function to update the component name in the dictionary
      function updateComponentNameInDictionary(oldName, newName) {
        // If the old name exists in the dictionary, update it
        if (componentCounts.hasOwnProperty(oldName)) {
          // If the new name is already in the dictionary, increment its count by the old count
          if (componentCounts.hasOwnProperty(newName)) {
            componentCounts[newName] += componentCounts[oldName];
          } else {
            // If the new name is not in the dictionary, add it and set its count to the old count
            componentCounts[newName] = componentCounts[oldName];
          }
          // Delete the old name from the dictionary
          delete componentCounts[oldName];
        }

        // Log the name change for debugging
        console.log("Component names updated in dictionary: ", componentCounts);
      }

      // Prevent drag on contenteditable elements
      componentsList.addEventListener("dragstart", function (e) {
        if (e.target.contentEditable === "true") {
          e.preventDefault();
        }
      });
      // Add component functionality
      document
        .getElementById("add-component-btn")
        .addEventListener("click", function () {
          const componentsList = document.getElementById("components-list");

          // Assuming 'componentCount' is a global dictionary tracking component counts
          const componentNames = document.querySelectorAll(".component-name");
          let maxNum = 0;

          componentNames.forEach((elem) => {
            const match = elem.textContent.match(/Component (\d+)/i);
            if (match && match[1]) {
              const num = parseInt(match[1], 10);
              if (num > maxNum) {
                maxNum = num;
              }
            }
          });

          const nextNum = maxNum + 1;
          const newComponentName = `Component ${nextNum}`;
          componentCounts[newComponentName] = 0; // Add new component with count 0 to the dictionary

          const newComponent = document.createElement("div");
          newComponent.className = "component-item border rounded-2 my-3";
          newComponent.draggable = false;
          newComponent.innerHTML = `
                    <div class="component-header d-flex justify-content-between align-items-center">
                        <span class="component-name" contenteditable="false" style="font-weight: bold; font-size: 20px;">${newComponentName}</span>
                        <span class="arrow-toggle">&#9660;</span>
                    </div>
                    <div class="component-details flex-column border rounded-2">
                        <div class="component-details-container bg-light p-2 border rounded-2" id="${newComponentName}-details-container">
                        <div class="spinner-overlay" style="display: none">
                        <div class="spinner"></div>
                     </div>
                            <ul class="component-details-content" data-type="page-items"> </ul>
                            <div class="container mx-auto flex flex-col py-1 justify-center items-center"></div>
                        </div>
                        <div class="input-group mt-3 p-2">
                            <input type="text" class="form-control" placeholder="Describe the component..."
                                aria-label="Component input"/>
                            <div class="input-group-append">
                                <button class="btn generate_component_btn btn-details rounded-button me-2" type="button">Generate</button>
                                <button class="btn btn-clear rounded-button me-2" type="button">Clear</button>
                                <button class="btn btn-delete rounded-button" type="button">Delete</button>
                            </div>
                        </div>
                    </div>
                `;

          componentsList.appendChild(newComponent);
          // Find the newly added .component-details-content within newComponent
          const newDetailsContent = newComponent.querySelector(
            ".component-details-content"
          );
          newComponent
            .querySelectorAll(".component-details-container")
            .forEach((container) => {
              container.addEventListener("click", onClickHandler, false);
            });

          // Instantiate a Dragoned_Component for it and add to the list
          instantiateAndAddToDragonedList(newDetailsContent);
        });

      function changeIDHandlerLog(event) {
        LOG.push(
          create_log_item(
            "Tutor Building",
            "Tutor",
            TUTOR_ID,
            "Change Element ID",
            concat(string(EditItem.id), "->", string(event.target.value))
          )
        );
      }

      function changeComponentValueLog(event) {
        LOG.push(
          create_log_item(
            "Tutor Building",
            "Tutor",
            TUTOR_ID,
            "Change Element Value",
            EditItem.id
          )
        );
      }

      function changeInputValueLog(event) {
        LOG.push(
          create_log_item(
            "Tutor Building",
            "Tutor",
            TUTOR_ID,
            "Change Input Value",
            EditItem.id
          )
        );
      }



      // Call the function to adjust the height
      function toggleSection(buttonId, sectionId) {
        var section = document.getElementById(sectionId);
        var button = document.getElementById(buttonId);

        // Check if the section is currently visible
        if (section.style.display === "none") {
          // If it's not visible, show it and update button style
          section.style.display = "block";
          button.classList.add("btn-dark");
          button.classList.remove("btn-light");
        } else {
          // If it's visible, hide it and update button style
          section.style.display = "none";
          button.classList.add("btn-light");
          button.classList.remove("btn-dark");
        }
      }

      function dragStartHandler(event) {
        if (EditItem) {
          EditItem.classList.remove("clicked");
        }

        event.dataTransfer.effectsAllowed = "copy";
        // event.dataTransfer.setData('text', ev.target.getAttribute('id'));
        dragItem = event.target;
        event.dataTransfer.setData("text/html", dragItem.id);
        // //console.log("DragstartId : ", dragItem.id);
        data = dragItem.id;
        sourceContainer = dragItem.parentNode;
        //console.log("drag started!!!");
        LOG.push(
          create_log_item(
            "Tutor Building",
            "Tutor",
            TUTOR_ID,
            "Drag Start",
            dragItem.id
          )
        );
        // alert(dragItem.classList);
        dragItem.classList.add("active");
      }

      function deleteComponentHandler(event) {
        if (selectedElements.length>0) {
          for (var i = 0; i < selectedElements.length; i++) {
            // //console.log("for loop!!!", allNames.length);
            let index = allNames.indexOf(selectedElements[i].id);
            allNames.splice(index, 1);
            selectedElements[i].remove()

            }
            selectedElements.splice(0, selectedElements.length);

          EditItem.remove();
          LOG.push(
            create_log_item(
              "Tutor Building",
              "Tutor",
              TUTOR_ID,
              "Delete",
              component
            )
          );

        }
      }




      function onClickHandler(event) {

        if (copyMode){
          clickCopy(event)
          toggleCopyMode(false)


          return
        }
        if (selectedElements.length>0 && !event.shiftKey) {

          for (var i = 0; i < selectedElements.length; i++) {
            // //console.log("for loop!!!", allNames.length);
             selectedElements[i].classList.remove("clicked")
            }
            selectedElements.splice(0, selectedElements.length);

        }

        LOG.push(
          create_log_item(
            "Tutor Building",
            "Tutor",
            TUTOR_ID,
            "Element Clicked",
            event.target.id
          )
        );
        if (
          event.target.id == "page-container" ||
          event.target.classList.contains("component-details-content") ||
          event.target.id == "page"
        ) {
          EditItem.classList.remove("clicked");
          return;
        }
        EditItem = event.target;

        // //console.log(EditItem.parentNode);
        if (
          event.target.id === "page-item" ||
          event.target.classList.contains("page-item-ul") ||
          event.target.classList.contains("page-item-rl-row")
        ) {
          EditItem = EditItem.parentNode;
        }

        createID = EditItem.id
        if (allNames.length == 0) {
          //console.log("first push!!!");
          allNames.push(createID);
          //console.log(allNames);
        } else {
          for (var i = 0; i < allNames.length; i++) {
            // //console.log("for loop!!!", allNames.length);
            if (allNames[i] === createID) {
              i++;
              //console.log(" duplicate!!!");
              break;
            } else if (
              i === allNames.length - 1 &&
              allNames[allNames.length - 1] !== createID
            ) {
              //console.log("This is not duplicate!");
              allNames.push(createID);
              //console.log(allNames);
              //console.log("length=======", allNames.length);
            }
          }
        }

        EditItem.classList.add("clicked");
        selectedElements.push(EditItem);
      }

      function changeIDHandler(event) {
        // //console.log("value : ", event.target.value);

        if (event.keyCode === 13) {
          for (var i = 0; i < allNames.length; i++) {
            // //console.log("for loop!!!", allNames.length);
            if (allNames[i] === event.target.value) {
              i++;
              alert("This id duplicated!,So you should be use other Id.");
              break;
            } else if (
              i === allNames.length - 1 &&
              allNames[allNames.length - 1] !== event.target.value
            ) {
              // LOG.push(create_log_item("Tutor Building", "Tutor"", TUTOR_ID, "Change Element ID", concat(string(EditItem.id), "->", string(event.target.value))));
              EditItem.id = event.target.value;
            }
          }

          //console.log("============",allNames);
        }
      }

      function changeComponentValue(event) {
        if (
          EditItem.firstChild !== null &&
          EditItem.firstChild.nodeName === "P"
        ) {
          EditItem.firstChild.innerHTML = event.target.value;
        } else if (EditItem.id.includes("inputItem")) {
          document.getElementById(EditItem.id).value = event.target.value;
          document
            .getElementById(EditItem.id)
            .setAttribute("value", event.target.value);
          //console.log(EditItem);
        }
        // LOG.push(create_log_item("Tutor Building", "Tutor"", TUTOR_ID, "Change Element Value", EditItem.id));
      }

      function changeInputValue(event) {
        // LOG.push(create_log_item("Tutor Building", "Tutor"", TUTOR_ID, "Change Input Value", EditItem.id));
        document.getElementById(EditItem.id).value = event.target.value;
        document
          .getElementById(EditItem.id)
          .setAttribute("value", event.target.value);
      }

      function updateNodeIds(node) {
 if (node.nodeName === "DIV") {
          // If it's a DIV, assign a new ID
          node.id = "newItem_" + item_count;
          item_count++;
        }

        // Recurse for each child node
        node.childNodes.forEach((child) => {
          updateNodeIds(child); // Use the same prefix for child nodes
        });
      }


      function clickCopy(event) {
        // Custom logic for when an item is dropped in the component gallery
        if (copyTarget) {
          if (dummyElement && dummyElement.parentNode) {
            dummyElement.parentNode.removeChild(dummyElement);
            
          }
          copyItem.classList.remove("clicked")
          //console.log("droptarget:", dropTarget);
          var nodeCopy = document.getElementById(copyItem.id).cloneNode(true);
          updateNodeIds(nodeCopy)

      
      const listItems = Array.from(copyTarget.children);
      let insertBeforeElement = null;

      if  (copyTarget.classList.contains("page-item-rl-row")) {
      // Find the child element to insert the dummy element before
      for (const item of listItems) {
        const rect = item.getBoundingClientRect();
        const halfwayPoint = rect.y + rect.height / 2;

        // Check if the mouse pointer is above the halfway point of the child element
        if (event.clientY < halfwayPoint) {
          insertBeforeElement = item;
          break;
        }
      } }
    else if  (copyTarget.classList.contains("page-item-ul")){
      for (const item of listItems) {
        const rect = item.getBoundingClientRect();
        const halfwayPoint = rect.x + rect.width / 2; // Change to calculate the horizontal halfway point
      
        // Check if the mouse pointer is to the left of the halfway point of the child element
        if (event.clientX < halfwayPoint) {
          insertBeforeElement = item;
          break; // Found the target item, stop looping
        }
      }}



          // Insert the nodeCopy at the determined position
          if (insertBeforeElement) {
            copyTarget.insertBefore(
              nodeCopy,
              insertBeforeElement
            ); } 
            else {
              copyTarget.appendChild(nodeCopy); // Fallback to append at the end
          }

          makeChange();
        
          } 

          LOG.push(
            create_log_item(
              "Tutor Building",
              "Tutor",
              TUTOR_ID,
              copyItem.id
            )
          );
          copyItem.classList.remove("active");
          copyTarget = null;
          copyItem = null;
          cleanSelected()
         
      }
      

      function dragEndHandler(event) {
        // Custom logic for when an item is dropped in the component gallery
        if (
          dropTarget &&
          (dropTarget.classList.contains("component-details-content") ||
            dropTarget.closest(".component-details-container"))
        ) {
          // Handle the drop inside the component gallery
          removeDummyElement();
          //console.log("droptarget:", dropTarget);
          // For logging
          var action_type = "Drag End Other";
          if (sourceContainer.id === "draggable") {
            var componentItem = dropTarget.closest(".component-item");
            // Get the component name from the 'component-name' span
            var componentName =
              componentItem.querySelector(".component-name").textContent;
            // Increment the count for this component
            incrementComponentCount(componentName);

            // Add the dragged element to the gallery
            // Assuming 'component-gallery-content' is the container where you want to add the elements
            var nodeCopy = document.getElementById(data).cloneNode(true);
            if (nodeCopy.firstElementChild.nodeName === "INPUT") {
              // For logging
              action_type = "Drag End Input";
              nodeCopy.firstElementChild.id = "inputItem_" + item_count;
            }
            nodeCopy.id =
              "galleryItem_" +
              componentName +
              "_" +
              componentCounts[componentName];

            dropTarget.appendChild(nodeCopy);
            //adjustColumnHeight();

            makeChange();
            //console.log(nodeCopy.firstElementChild.nodeName);
          }
        } else if (dropTarget) {
          removeDummyElement();
          //console.log("droptarget:", dropTarget);
          // For logging
          var action_type = "Drag End Other";
          if (data.startsWith("galleryItem_")) {
            //console.log(nodeCopy.firstElementChild.nodeName);
            var nodeCopy = document.getElementById(data).cloneNode(true);
            // Assume 'galleryItem_' prefix indicates special handling, such as keeping certain attributes
            updateNodeIds(nodeCopy); // Recursively update IDs for the node and its children

            dropTarget.appendChild(nodeCopy);
          } else if (
            document
              .querySelector("#page-container")
              .contains(document.getElementById(data))
          ) {


        const listItems = Array.from(dropTarget.children);
        let insertBeforeElement = null;

        if  (dropTarget.classList.contains("page-item-rl-row")) {
        // Find the child element to insert the dummy element before
        for (const item of listItems) {
          const rect = item.getBoundingClientRect();
          const halfwayPoint = rect.y + rect.height / 2;

          // Check if the mouse pointer is above the halfway point of the child element
          if (event.clientY < halfwayPoint) {
            insertBeforeElement = item;
            break;
          }
        } }
      else if  (dropTarget.classList.contains("page-item-ul")){
        for (const item of listItems) {
          const rect = item.getBoundingClientRect();
          const halfwayPoint = rect.x + rect.width / 2; // Change to calculate the horizontal halfway point
        
          // Check if the mouse pointer is to the left of the halfway point of the child element
          if (event.clientX < halfwayPoint) {
            insertBeforeElement = item;
            break; // Found the target item, stop looping
          }
        }}



            // Insert the nodeCopy at the determined position
            if (insertBeforeElement) {
              dropTarget.insertBefore(
                document.getElementById(data),
                insertBeforeElement
              );
            } else {
              dropTarget.appendChild(document.getElementById(data)); // Fallback to append at the end
            }

            makeChange();
          } else if (sourceContainer.id === "draggable") {
            var nodeCopy = document.getElementById(data).cloneNode(true);
            nodeCopy.id = "newItem_" + item_count;

            if (nodeCopy.firstElementChild.nodeName === "INPUT") {
              action_type = "Drag End Input";
              nodeCopy.firstElementChild.id = "inputItem_" + item_count;
            }
            item_count++;
        
        const listItems = Array.from(dropTarget.children);
        let insertBeforeElement = null;

        if  (dropTarget.classList.contains("page-item-rl-row")) {
        // Find the child element to insert the dummy element before
        for (const item of listItems) {
          const rect = item.getBoundingClientRect();
          const halfwayPoint = rect.y + rect.height / 2;

          // Check if the mouse pointer is above the halfway point of the child element
          if (event.clientY < halfwayPoint) {
            insertBeforeElement = item;
            break;
          }
        } }
      else if  (dropTarget.classList.contains("page-item-ul")){
        for (const item of listItems) {
          const rect = item.getBoundingClientRect();
          const halfwayPoint = rect.x + rect.width / 2; // Change to calculate the horizontal halfway point
        
          // Check if the mouse pointer is to the left of the halfway point of the child element
          if (event.clientX < halfwayPoint) {
            insertBeforeElement = item;
            break; // Found the target item, stop looping
          }
        }}



            // Insert the nodeCopy at the determined position
            if (insertBeforeElement) {
              dropTarget.insertBefore(
                nodeCopy,
                insertBeforeElement
              ); } 
              else {
              dropTarget.appendChild(nodeCopy); // Fallback to append at the end
            }

            makeChange();
          } else {
            //console.log("Drop Target : ", dropTarget);
          }
          LOG.push(
            create_log_item(
              "Tutor Building",
              "Tutor",
              TUTOR_ID,
              action_type,
              dragItem.id
            )
          );
          dragItem.classList.remove("active");
          dropTarget = null;
          dragItem = null;
        } else {
          dragItem.classList.remove("active");
        }
      }
      function dropHandler(event) {
        //console.log("Droppped ....");
      }

      function removeDummyElement() {
        if (dropTarget && dropTarget.contains(dummyElement)) {
          dropTarget.removeChild(dummyElement);
        }
      }

      const draggable = new Dragoned(document.querySelector("#draggable"), {
        sort: false,
        clone: true,
        group: "blocks-group",
      });

      const editable = new Dragoned_Component(
        document.querySelector("#page-container"),
        {
          sort: false,
          clone: true,
          group: "blocks-group",
        }
      );
      // Example function to toggle copy mode and bind/unbind copyOverHandler
      function toggleCopyMode(activate) {
        copyMode = activate;
        const label = document.getElementById('copyModeLabel');

        const pageContainer = document.getElementById('page_parent');

        if (copyMode) {
          pageContainer.classList.add('copy-mode-border');
          pageContainer.classList.remove('border');
          label.style.display = 'block';

          // Assuming `editable` is your instance of Dragoned_Component
          editable.container.addEventListener('mouseover', editable.copyOverHandler);
          editable.container.removeEventListener('dragover', editable.dragOverHandler);

        } else {
          pageContainer.classList.remove('copy-mode-border');
          label.style.display = 'none';

          editable.container.addEventListener('dragover', editable.dragOverHandler);

          editable.container.removeEventListener('mouseover', editable.copyOverHandler);
        }
      }
      let dragonedComponentsList = []; // Initialize an empty array to hold the instances

      document
        .querySelectorAll(".component-details-content")
        .forEach((element) => {
          let instance = new Dragoned_Component(element, {
            sort: false,
            clone: true,
            group: "blocks-group",
          });
          dragonedComponentsList.push(instance); // Add the instance to the list
        });
      
      function instantiateAndAddToDragonedList(element) {
        let instance = new Dragoned_Component(element, {
          sort: false,
          clone: true,
          group: "blocks-group",
        });
        dragonedComponentsList.push(instance);
      }


        
    })();
  });
});
/**
 * Creates a log item object representing an action taken by an actor on a component.
 * This function is useful for tracking user actions or system events for auditing or debugging purposes.
 *
 * @param {string} component - The component on which the action is performed (e.g., a specific module or system part).
 * @param {string} actor - The entity performing the action (e.g., a user, system process).
 * @param {string|number} actor_id - A unique identifier for the actor.
 * @param {string} action_type - The type of action performed (e.g., "update", "delete").
 * @param {string|number} action_value - The value or outcome of the action (e.g., the new value after an update).
 * @returns {Object} An object representing the log item, including a timestamp, the component, actor, actor ID, action type, and action value.
 */
function create_log_item(
  component,
  actor,
  actor_id,
  action_type,
  action_value
) {
  return {
    time_stamp: new Date().toLocaleString(),
    component: component,
    actor: actor,
    actor_id: actor_id,
    action_type: action_type,
    action_value: action_value,
  };
}

function get_request_body(
  tutor_id,
  tutor_name = null,
  content = null,
  log_items = null
) {
  return {
    tutor_id: tutor_id,
    tutor_name: tutor_name,
    content: content,
    log_items: LOG,
  };
}
