var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
    // create elements that make up a task item
    var taskLi = $("<li>").addClass("list-group-item");
    var taskSpan = $("<span>")
        .addClass("badge badge-primary badge-pill")
        .text(taskDate);
    var taskP = $("<p>")
        .addClass("m-1")
        .text(taskText);

    // append span and p element to parent li
    taskLi.append(taskSpan, taskP);

    // check due date
    auditTask(taskLi);

    // append to ul list on the page
    $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
    tasks = JSON.parse(localStorage.getItem("tasks"));

    // if nothing in localStorage, create a new object to track all task status arrays
    if (!tasks) {
        tasks = {
            toDo: [],
            inProgress: [],
            inReview: [],
            done: []
        };
    }

    // loop over object properties
    $.each(tasks, function(list, arr) {
        // console.log(list, arr);
        // then loop over sub-array
        arr.forEach(function(task) {
            createTask(task.text, task.date, list);
        });
    });
};

var saveTasks = function() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
};

// create a task or edit its due date
var auditTask = function(taskEl) {
    // get date from task element
    var date = $(taskEl).find("span").text().trim();
    // ensure it worked
    // console.log(date);

    // convert to moment object at 5:00pm
    var time = moment(date, "L").set("hour", 17);
    // this should print out an object fir the value of the date variable, but at 5:00pm of that date
    // console.log(time);

    // remove any old classes from element
    $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

    // apply new class if task is near/over due date
    if (moment().isAfter(time)) {
        $(taskEl).addClass("list-group-item-danger");
    } else if (Math.abs(moment().diff(time, "days")) <= 2) {
        $(taskEl).addClass("list-group-item-warning");
    }
    // console.log(taskEl)
};

// enable draggable/sortable feature on list-group elements
// jQuery UI method
$(".card .list-group").sortable({
    connectWith: $(".card .list-group"),
    scroll: false,
    tolreance: "pointer",
    helper: "clone",
    activate: function(event, ui) {
        // console.log(event, ui);
        $(this).addClass("dropover");
        $(".bottom-trash").addClass("bottom-trash-drag");
    },
    deactivate: function(event, ui) {
        // console.log(event, ui);
        $(this).removeClass("dropover");
        $(".bottom-trash").removeClass("bottom-trash-drag");
    },
    over: function(event) {
        // console.log(event);
        $(event.target).addClass("dropover-active");
    },
    out: function(event) {
        // console.log(event);
        $(event.target).removeClass("dropover-active");
    },
    update: function(event) {
        // array to store the task data in
        var tempArr = [];

        // loop over current set of children in sortable list
        $(this)
            .children()
            .each(function() {
                // save values in temp array
                tempArr.push({
                    text: $(this)
                        .find("p")
                        .text()
                        .trim(),
                    date: $(this)
                        .find("span")
                        .text()
                        .trim()
                });
            });

        // trim down list's ID to match object property
        var arrName = $(this)
            .attr("id")
            .replace("list-", "");

        // update array on tasks object and save
        tasks[arrName] = tempArr;
        saveTasks();
    },
    stop: function(event) {
        $(this).removeClass("dropover");
    }
});

// make use of this trash placeholder
$("#trash").droppable({
    accept: ".card .list-group-item",
    tolerance: "touch",
    drop: function(event, ui) {
        // remove dragged element from the dom
        ui.draggable.remove();
        $(".bottom-trash").removeClass("bottom-trash-active");
    },
    over: function(event, ui) {
        console.log(ui);
        $(".bottom-trash").addClass("bottom-trash-active");
    },
    out: function(event, ui) {
        // console.log(ui);
        $(".bottom-trash").removeClass("bottom-trash-active");
    }

});

$("#modalDueDate").datepicker({
    minDate: 1
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
    // clear values
    $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
    // highlight textarea
    $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
    // get form values
    var taskText = $("#modalTaskDescription").val();
    var taskDate = $("#modalDueDate").val();

    if (taskText && taskDate) {
        createTask(taskText, taskDate, "toDo");

        // close modal
        $("#task-form-modal").modal("hide");

        // save in tasks array
        tasks.toDo.push({
            text: taskText,
            date: taskDate
        });

        saveTasks();
    }
});

// task text was clicked     event delegation using .on()
$(".list-group").on("click", "p", function() {
    var text = $(this)
        .text()
        .trim();

    // replace p element with a new textarea
    var textInput = $("<textarea>")
        .addClass("form-control")
        .val(text);
    $(this).replaceWith(textInput);
    // auto focus new element
    textInput.trigger("focus");
    // console.log(text);
});

// editable field was un-focused     The client has requested that the <textarea> revert back when it goes out of focus, so we can use that event in lieu of a "Save" button.
$(".list-group").on("blur", "textarea", function() {
    //get the textarea's current value/text
    var text = $(this)
        .val()
        .trim();

    //get the pafent ul's id attribute
    var status = $(this)
        .closet(".list-group")
        .attr("id")
        .replace("list-", "");

    //get the taks's position in the list of other li elements
    var index = $(this)
        .closet(".list-group-item")
        .index();

    //we don't know the values, we'll have to use the variable names as placeholders.
    // update task in array and re-save to localstorage
    tasks[status][index].text = text;
    saveTasks();

    //recreate p element
    var taskP = $("<p>")
        .addClass("m-1")
        .text(text);

    //replace textarea with p element
    $(this).replaceWith(taskP);
});

//due date was clicked
$(".list-group").on("click", "span", function() {
    //get current text
    var date = $(this)
        .text()
        .trim();

    //create new input element
    var dateInput = $("<input>")
        .attr("type", "text")
        .addClass("form-control")
        .val(date);

    //swap out elements
    $(this).replaceWith(dateInput);

    // enable jquery ui datepicker
    dateInput.datepicker({
        minDate: 1,
        onClose: function() {
            // wehn calendar is closed, force a "change" event on the 'dateinout'
            $(this).trigger("change");
        }
    });

    //automatically focus on new element
    dateInput.trigger("focus");
});

//value of due date was changed
$(".list-group").on("change", "input[type='text']", function() {
    //get current text
    var date = $(this)
        .val()
        .trim();

    //get parent ul's id attribute
    var status = $(this)
        .closest(".list-group")
        .attr("id")
        .replace("list-", "");

    //get the task's position in the list of other li elements
    var index = $(this)
        .closest(".list-group-item")
        .index();

    //update task in array and re-save to localstorage
    tasks[status][index].date = date;
    saveTasks();

    //recreate span element with bootstrap classses
    var taskSpan = $("<sapn>")
        .addClass("badge badge-primary badge-pill")
        .text(date);

    //replace input with sapn element
    $(this).replaceWith(taskSpan);

    // pass task's <li> element into auditTask() to check new due date
    auditTask($(taskSpan).closet(".list-group-item"));
});

// remove all tasks
$("#remove-tasks").on("click", function() {
    for (var key in tasks) {
        tasks[key].length = 0;
        $("#list-" + key).empty();
    }
    saveTasks();
});

// load tasks for the first time
loadTasks();

setInterval(function() {
    $(".card .list-group-item").each(function(index, el) {
        auditTask(el);
    });
}, (1000 * 60) * 30);