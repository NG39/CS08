<script>
  import ApolloClient from "apollo-boost";
  import { query, mutate } from "svelte-apollo";
  import { client } from "../gqlClient";
  import { session } from "../stores";

  import {
    GET_STUDENTS_GQL,
    ADD_STUDENT_GQL,
    EDIT_STUDENT_GQL,
    DELETE_STUDENT_GQL,
    ADD_STUDENT_GRADE_GQL,
    EDIT_STUDENT_GRADE_GQL,
    DELETE_STUDENT_GRADE_GQL,
    ADD_S_OVERALL_GRADE_GQL,
    EDIT_S_OVERALL_GRADE_GQL,
    DELETE_OVS_GRADE_GQL
  } from "../utils/gql/gqloperations";
  import Card from "../components/Card.svelte";
  //import TitleBar from '../components/TitleBar.svelte'
  import LevelSelection from "../components/LevelSelection.svelte";
  import YearSelection from "../components/YearSelection.svelte";
  import DegreeSelection from "../components/DegreeSelection.svelte";
  import CourseSelection from "../components/CourseDegreeWtSelection.svelte";
  import StatusSelection from "../components/StatusSelection.svelte";
   function checkUser(){
    if($session.user!=null){
      return $session.user.role=="Restricted"
  }
}
  let restricted =checkUser()

  let deleteContext = "",
    DeleteSubTitle = "";
  let studentObject = {};
  let isDataInvalid = false;
  let deleteStudent = {};
  let searchString = "",
    DeleteError = "";

  let buttonSaveIsLoading = false;
  $: buttonSaveClass =
    buttonSaveIsLoading === true
      ? "button is-success is-loading"
      : "button is-success";

  let buttonDeleteIsLoading = false;
  $: buttonDeleteClass =
    buttonDeleteIsLoading === true
      ? "button is-danger is-loading"
      : "button is-danger";

  let modalIsVisible = false;
  $: modalClass = modalIsVisible === true ? "modal is-active" : "modal";
  //========== Generic functions ===========
  function deleteRecord() {
    if (deleteContext === "Student") {
      deleteStudentRecord();
    }

    if (deleteContext === "Grade") {
      deleteGradeRecord();
    }
    if (deleteContext === "OVSGrade") {
      deleteOVSGRecord();
    }
  }

  //Hide /Show
  const GradesDiv = "GradesDiv",
    ShowBtnText = "Show All Grades",
    HideBtnText = "Collapse";

  function ShowOrHideGrades(e) {
    e.preventDefault();
    const ButtonID = e.target.id;
    var TargetElementsClass = "." + GradesDiv + ButtonID;
    var BtnText = document.getElementById(ButtonID).textContent.toLowerCase();

    if (BtnText.includes(ShowBtnText.toLowerCase())) {
      document.getElementById(ButtonID).textContent = HideBtnText;
      document.querySelectorAll(TargetElementsClass).forEach(function(el) {
      
        el.style.display = "block";
        //el.setAttribute("hidden", "true")
        //el.hidden = false;
      });
    } else {
      document.getElementById(ButtonID).textContent = ShowBtnText;
      document.querySelectorAll(TargetElementsClass).forEach(function(el) {
        el.style.display = "none";
        //el.removeAttribute("hidden")
        //el.hidden = true;
      });
    }
  }

  //==========End of Generic functions ===========

  //=======Student Overall Grade functions  =======
  //  let selected ,selectedOvSGLevel ;
  let OvSCRUDObject = { grade: 0, studentLevel: "First", year: "" };
  let isOvsGDataInvalid = false;
  let buttonOvSGSaveIsLoading = false;
  $: buttonOvSGSaveClass =
    buttonOvSGSaveIsLoading === true
      ? "button is-success is-loading"
      : "button is-success";

  let modalOvSGIsVisible = false;
  $: modaloVSGradeClass =
    modalOvSGIsVisible === true ? "modal is-active" : "modal";

  function openOvSGModal() {
    modalOvSGIsVisible = true;
  }
  function closeOvSGModal() {
    OvSCRUDObject = { grade: 0, studentLevel: "First", year: "" };
    modalOvSGIsVisible = false;
  }

  function saveOvSGrade() {
  

    if (validateOvSGrade(OvSCRUDObject)) {
      const EditOvSGObject = {
        data: {
          student: OvSCRUDObject.student,
          year: OvSCRUDObject.year,
          studentLevel: OvSCRUDObject.studentLevel,
          grade: OvSCRUDObject.grade
        }
      };

      if (OvSCRUDObject.id) {
        EditOvSGObject.id = OvSCRUDObject.id;
      }
  
      //if Id exists, then edit and save
      if (EditOvSGObject.id) {
        const courseEdit = mutate(client(), {
          mutation: EDIT_S_OVERALL_GRADE_GQL,
          variables: EditOvSGObject
        })
          .then(data => {
            OvSCRUDObject = {};
            GET_STUDENTS_LIST.refetch();
            closeOvSGModal();
          })
          .catch(e => {
            console.error("Error during Edit of Overall Grade  : ", e);
          });
      } else {
        //if ID does not exist, then insert
        const courseAdd = mutate(client(), {
          mutation: ADD_S_OVERALL_GRADE_GQL,
          variables: EditOvSGObject
        })
          .then(data => {
            OvSCRUDObject = {};
            GET_STUDENTS_LIST.refetch();
            closeOvSGModal();
          })
          .catch(e => {
            console.error("Error during Insertion of Overall Grade  : ", e);
          });
      }
    }
  }

  function validateOvSGrade(OvSCRUDObject) {
    if (
      OvSCRUDObject.studentLevel.length < 1 ||
      OvSCRUDObject.year.length < 1 ||
      !OvSCRUDObject.grade
    ) {
      isOvsGDataInvalid = true;
      return false;
    } else {
      isOvsGDataInvalid = false;
      return true;
    }
  }

  function AddOvSGrade(degreeid, studentid) {
    console.log("In AddOvSGrade:: degreeid=", degreeid);
    OvSCRUDObject = { grade: 0, studentLevel: "First", year: "" };
    OvSCRUDObject = {
      student: studentid,
      studentLevel: "First",
      year: "",
      grade: 0
    };
    openOvSGModal();
  }

  function EditOvSGrade(OvSGradeRecord, degreeid, studentid) {
 
    OvSCRUDObject = {
      id: OvSGradeRecord.id,
      student: studentid,
      year: OvSGradeRecord.year,
      studentLevel: OvSGradeRecord.studentLevel,
      grade: OvSGradeRecord.grade
    };

    

    openOvSGModal();
  }

  function DeleteOvSGrade(OvSGradeRecord) {
    OvSGradeRecord = OvSGradeRecord;
    OvSCRUDObject = {};
    OvSCRUDObject = {
      id: OvSGradeRecord.id
    };
    deleteContext = "OVSGrade";
    DeleteSubTitle = " Overall Grade ";
    openDeleteModal();
    
  }

  function deleteOVSGRecord() {
    const studentDelete = mutate(client(), {
      mutation: DELETE_OVS_GRADE_GQL,
      variables: { id: `${OvSCRUDObject.id}` }
    })
      .then(data => {
        OvSCRUDObject = {};
        GET_STUDENTS_LIST.refetch();
        closeDeleteModal();
      })
      .catch(e => {
        console.error("Error during Delete. ");
        DeleteError = e;
      });
  }

  // ===========End of Student Overall Grade functions etc ======

  //==========Grade functions etc ==========
  let GradeObject = { weight: 0, grade: 0, status: "OK" };
  let isGradeDataInvalid = false;
  let buttonGradeSaveIsLoading = false;
  $: buttonGradeSaveClass =
    buttonGradeSaveIsLoading === true
      ? "button is-success is-loading"
      : "button is-success";

  let modalGradeIsVisible = false;
  $: modalGradeClass =
    modalGradeIsVisible === true ? "modal is-active" : "modal";

  function openGradeModal() {
    modalGradeIsVisible = true;
  }
  function closeGradeModal() {
    modalGradeIsVisible = false;
  }

  function saveGrade() {
    EditGradeRecord();
  }

  function AddGrade(studentid, degreeID) {
    GradeObject = {
      student: studentid,
      courseID: "",
      weight: 0,
      grade: 0,
      date: 0,
      degreeID,
      status: "OK"
    };
    openGradeModal();
  }

  function EditGrade(sgrade, studentid, degreeID) {
    GradeObject = {
      id: sgrade.id,
      student: studentid,
      courseID: sgrade.course.id,
      weight: sgrade.weight,
      grade: sgrade.grade,
      date: sgrade.date,
      status: sgrade.status,
      degreeID
    };
    openGradeModal();
  }

  function DeleteGrade(sgrade) {
    GradeObject.id = sgrade.id;
 
    deleteContext = "Grade";
    DeleteSubTitle = " Grade ";
    openDeleteModal();
  }

  function deleteGradeRecord() {
    const GradeRecordToDelete = mutate(client(), {
      mutation: DELETE_STUDENT_GRADE_GQL,
      variables: { id: `${GradeObject.id}` }
    })
      .then(data => {
        GradeObject = {};
        GET_STUDENTS_LIST.refetch();
        closeDeleteModal();
      })
      .catch(e => {
        console.error("Error during Grade Delete.");
        DeleteError = e;
      });
  }

  function EditGradeRecord() {
  
    if (validateGrade(GradeObject)) {
      const EditGradeVariables = {
        data: {
          student: GradeObject.student,
          course: GradeObject.courseID,
          weight: GradeObject.weight,
          grade: GradeObject.grade,
          date: GradeObject.date,
          status: GradeObject.status
        }
      };

      if (GradeObject.id) {
        EditGradeVariables.id = GradeObject.id;
      }

      console.log("EditGradeRecord EditGradeVariables=", EditGradeVariables);

      if (GradeObject.id) {
        const gradeEditMutate = mutate(client(), {
          mutation: EDIT_STUDENT_GRADE_GQL,
          variables: EditGradeVariables
        })
          .then(data => {
            GradeObject = {};
            GET_STUDENTS_LIST.refetch();
            closeGradeModal();
          })
          .catch(e => {
            console.error("Error during Edit of Grade. ");
          });
      } else {
        //if Id does not exist, then insert
        const gradeAddMutant = mutate(client(), {
          mutation: ADD_STUDENT_GRADE_GQL,
          variables: EditGradeVariables
        })
          .then(data => {
            GradeObject = {};
            GET_STUDENTS_LIST.refetch();
            closeGradeModal();
          })
          .catch(e => {
            console.error("Error during Insertion of Grade. ");
          });
      }
    } //end of Validation
  }
  function validateGrade(gradeObject) {
 
    if (
      gradeObject.courseID.length < 1 ||
      !gradeObject.weight ||
      !gradeObject.grade ||
      !gradeObject.date ||
      !gradeObject.status 
    ) {
      isGradeDataInvalid = true;
      return false;
    } else {
      isGradeDataInvalid = false;
      return true;
    }
  }

  //==========End of Grade functions etc ==========

  let modalDeleteIsVisible = false;
  $: modalDeleteClass =
    modalDeleteIsVisible === true ? "modal is-active" : "modal";

  //============Validation etc =======================
  function resetSearch() {
    searchString = "";
    GET_STUDENTS_LIST.refetch({ searchString });
  }

  function SearchEvent(e) {
    let TargetValue = e.target.value;
    searchString = TargetValue;
 
    GET_STUDENTS_LIST.refetch({ searchString });
  }
  function TitleBarChangeEvent() {
    //console.log("TitleBarChangeEvent called");
  }
  function NewStudentClick() {
    //console.log("NewStudentClick called");
    AddNewStudent();
  }

  function validateStudent(studentObject) {

    if (
      studentObject.degreeID.length < 1 ||
      studentObject.level.length < 1 ||
      studentObject.entryYear.length < 1 ||
      !studentObject.firstname ||
      !studentObject.surname ||
      !studentObject.guid
    ) {
      isDataInvalid = true;
      return false;
    } else {
      isDataInvalid = false;
      return true;
    }
  }

  //=== end of Validation etc =========================

  //=============  APOLLO cLIENT cALLS ====================
  function EditStudent() {
    
    if (validateStudent(studentObject)) {
      const EditObject = {
        id: studentObject.id,
        data: {
          degree: studentObject.degreeID,
          firstname: studentObject.firstname,
          surname: studentObject.surname,
          guid: studentObject.guid,
          level: studentObject.level,
          entryYear: studentObject.entryYear
        }
      };
    

      const courseEdit = mutate(client(), {
        mutation: EDIT_STUDENT_GQL,
        variables: EditObject
      })
        .then(data => {
          studentObject = {};
          GET_STUDENTS_LIST.refetch();
          closeModal();
        })
        .catch(e => {
          console.error("Error during Edit Student. ");
        });
    }
  }

  function deleteStudentRecord() {
    const studentDelete = mutate(client(), {
      mutation: DELETE_STUDENT_GQL,
      variables: { id: `${studentObject.id}` }
    })
      .then(data => {
        studentObject = {};
        GET_STUDENTS_LIST.refetch();
        closeDeleteModal();
      })
      .catch(e => {
        console.error("Error during Delete. ");
        DeleteError = e;
      });
  }

  function CreateStudent() {
    if (validateStudent(studentObject)) {
      const InsertObject = {
        data: {
          degree: studentObject.degreeID,
          firstname: studentObject.firstname,
          surname: studentObject.surname,
          guid: studentObject.guid,
          level: studentObject.level,
          entryYear: studentObject.entryYear
        }
      };
     

      const studentCreate = mutate(client(), {
        mutation: ADD_STUDENT_GQL,
        variables: InsertObject
      })
        .then(data => {
          studentObject = {};
          GET_STUDENTS_LIST.refetch();
          closeModal();
        })
        .catch(e => {
          console.error("Error during Insert Student. ");
        });
    }
  }
  //End of APOLLO cLIENT cALLS
  //========================================

  let GET_STUDENTS_LIST = query(client(), {
    query: GET_STUDENTS_GQL,
    variables: { searchString }
  });

  function ReloadStudents() {
    GET_STUDENTS_LIST.refetch();
  }
  //

  //==========Model Functions ===========

  function onItemClick(item) {
    studentObject = item;
    studentObject.degreeID = item.degree.id;

    openModal();
  }

  async function onDeleteClick(item) {
    deleteContext = "Student";
    DeleteSubTitle = " Student ";
    studentObject = item;
    openDeleteModal();
  }

  function closeModal() {
    modalIsVisible = false;
  }

  function closeDeleteModal() {
    modalDeleteIsVisible = false;
  }

  function openModal() {
    isDataInvalid = false;
    modalIsVisible = true;
  }

  function openDeleteModal() {
    DeleteError = "";
    modalDeleteIsVisible = true;
  }

  function AddNewStudent() {
    studentObject = {
      firstname: "",
      surname: "",
      guid: "",
      level: "First",
      studentID: "",
      degreeID: "",
      entryYear: ""
    };
    openModal();
  }

  async function save() {
    try {
      buttonSaveIsLoading = true;
      //logic here
      if (studentObject.id) {
        EditStudent();
      } else {
        CreateStudent();
      }
    } catch (error) {
      console.log(error);
    } finally {
      buttonSaveIsLoading = false;
    }
  }

  //===== End of Modal functions
</script>

<svelte:head>
  <title>List of Students</title>
  <!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.8.0/css/bulma.min.css" /> 
  -->
  <style>
    .select1 position relative display inline-block margin-bottom 15px width
        100% select display inline-block width 100% cursor pointer padding 10px
        15px outline 0 border 0 border-radius 0 background $color--light-grey
        color $color--dark-grey appearance none -webkit-appearance none -moz-appearance
        none &: : -ms-expand display none &: hover,
      &: focus color $color--black background $color--grey &: disabled opacity
        0.5 pointer-events none .select__arrow position absolute top 16px right
        15px width 0 height 0 pointer-events none border-style solid
        border-width 8px 5px 0 5px border-color $color--dark-grey transparent
        transparent transparent .select select: hover ~& .select select: focus
        ~& border-top-color $color--black .select select: disabled ~&
        border-top-color $color--grey;
  </style>
</svelte:head>

{#if $session.user}
  <!-- Title Bar -->
  <div class="container is-fullhd ">
    <div class="notification">

      <nav class="level">
        <!-- Left side -->
        <div class="level-left">
          <div class="level-item">
            <p class="subtitle is-5">
              <strong>
                List of Students {searchString.trim().length > 0 ? 'for search query ' + searchString : ''}
              </strong>
            </p>
          </div>
        </div>

        <!-- Search  -->
        <div class="level-right">
          <div class="level-item">
            <div class="field">
              <p class="control has-icons-right">
                <input
                  id="searchStringElement"
                  on:input={SearchEvent}
                  bind:value={searchString}
                  class="input is-rounded"
                  type="text"
                  placeholder="Search Student" />
                <span class="icon is-small is-right">
                  <i class="fas fa-search" />
                </span>
              </p>

            </div>
            {#if searchString.trim().length > 0}
              <p class="level-item">
                <a
                  href="javascript:;"
                  on:click={resetSearch}
                  class="button is-success">
                  Reset Search
                </a>
              </p>
            {/if}
            {#if !restricted}
            <p class="level-item">
              <a
                href="javascript:;"
                on:click={NewStudentClick}
                class="button is-success">
                Add New Student
              </a>
            </p>
            {/if}
          </div>

        </div>

        <!-- End of Search -->

      </nav>
    </div>
  </div>

  <!-- Start of Iteration Students -->
  {#await $GET_STUDENTS_LIST}
    <progress class="progress is-small is-primary" max="100">15%</progress>
  {:then data}

    <section class="section cards">
      <div class="container">
        <div class="columns is-multiline">

          {#each data.data['getStudents'] as student, i}
            <div class="column">
              <Card title={student.firstname + ' ' + student.surname}>
                <table
                  class="table is-striped is-narrow is-hoverable is-fullwidth">
                  <thead>
                    <tr>
                      <th>First Name</th>
                      <th>Surname</th>
                      <th>Degree</th>
                      <th>Level</th>
                      <th>GUID</th>
                      <th>Entry Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{student.firstname}</td>
                      <td>{student.surname}</td>
                      <td>{student.degree.name}</td>
                      <td>{student.level}</td>
                      <td>{student.guid}</td>
                      <td>{student.entryYear}</td>
                    </tr>
                  </tbody>
                </table>
                {#if !restricted}
                <!-- Student Buttons -->
                <div class="columns is-centered">
                  <div class="column">
                    <a
                      class="button is-success"
                      href="javascript:;"
                      on:click={() => onItemClick(student)}>
                      <span class="icon is-small">
                        <i class="fas fa-edit" />
                      </span>
                      <span>Edit Student</span>
                    </a>
                  </div>
                  <div class="column">
                    <a
                      class="button is-danger"
                      href="javascript:;"
                      on:click={() => onDeleteClick(student)}>
                      <span class="icon is-small">
                        <i class="fas fa-trash" />
                      </span>
                      <span>Delete Student</span>
                    </a>
                  </div>

                  {#if student['mygrades'].length >= 0}
                    <div class="column">
                      <a
                        href="javascript:;"
                        on:click={() => AddGrade(student.id, student.degree.id)}
                        class="button is-success is-rounded">
                        <span class="icon">
                          <i class="fas fa-plus" />
                        </span>
                        &nbsp;&nbsp;Add Grade
                      </a>
                    </div>
                  {/if}
                </div>
                <hr />
                <!-- End of Student Buttons -->
                  {/if}
                <!-- Grades Start here -->
                {#if student['mygrades'].length >= 0 }  
                  <div class="columns">
                    <div class="column is-one-third">
                      <span class="tag is-primary is-large">
                        {student['mygrades'].length} Grades
                      </span>
                    </div>
                      <div class="column is-one-third">
                      <button
                        id={student.degree.id}
                        class="button"
                        on:click={ShowOrHideGrades}>
                        {ShowBtnText}
                      </button>
                    </div>
                    {#if !restricted}
                    <div class="column is-one-third">
                      <a
                        href="javascript:;"
                        on:click={() => AddGrade(student.id, student.degree.id)}
                        class="button is-success is-rounded {GradesDiv}{student.degree.id}"
                        style="display: none;">
                        <span class="icon">
                          <i class="fas fa-plus" />
                        </span><span>Add Grade</span>
                      </a>
                    </div>
                    {/if}


                  </div>
                  <div
                    class="{GradesDiv}{student.degree.id}"
                    style="display: none;">
                    <div class="columns">
                      <div class="column is-one-sixth">
                        <strong>Course</strong>
                      </div>
                      <div class="column is-one-sixth">
                        <strong>Weight</strong>
                      </div>
                      <div class="column is-one-sixth">
                        <strong>Grade</strong>
                      </div>
                      <div class="column is-one-sixth">
                        <strong>Date</strong>
                      </div>
                      <div class="column is-one-sixth">
                        <strong>Status</strong>
                      </div>
                      <div class="column is-one-sixth" />
                      <div class="column is-one-sixth" />
                    </div>
                  </div>
                 {/if}
                
                <div
                  class="{GradesDiv}{student.degree.id}"
                  style="display: none;">        
                {#each student['mygrades'] as sgrade, i}
                    <div class="columns">
                      <div class="column is-one-sixth">
                        {sgrade.course.name}
                      </div>
                      <div class="column is-one-sixth">{sgrade.weight}</div>
                      <div class="column is-one-sixth">
                      {#if sgrade.status == "OK"}
                      {sgrade.grade}
                      {:else}Please fix status.{/if}
                      </div>

                      <div class="column is-one-sixth">{sgrade.date}</div>
                      <div class="column is-one-sixth">{sgrade.status}</div>
                      {#if !restricted}
                      <div class="column is-one-sixth">
                        <a
                          class="button is-success"
                          href="javascript:;"
                          on:click={() => EditGrade(sgrade, student.id, sgrade.student.degree.id)}>
                          <span class="icon is-small">
                            <i class="fas fa-edit" />
                          </span>
                        </a>
                      </div>
                      <div class="column is-one-sixth">
                        <a
                          class="button is-danger"
                          href="javascript:;"
                          on:click={() => DeleteGrade(sgrade)}>
                          <span class="icon is-small">
                            <i class="fas fa-trash" />
                          </span>
                        </a>
                      </div>
                      {/if}
                    </div>
                  {/each}
        
                  

                  <!-- End of Student Grades -->

                  <!-- Student Overall Grade starts here -->
                  {#if student['mygrades'].length > 0 && student['myoverallgrades'].length <= 0 && !restricted}
                    <p>
                      <a
                        href="javascript:;"
                        on:click={() => AddOvSGrade(student.degree.id, student.id)}
                        class="button is-success is-rounded">
                        <span class="icon">
                          <i class="fas fa-plus" />
                        </span>
                        &nbsp;&nbsp; Add Overall Grade
                      </a>
                    </p>
                  {/if}

                  {#if student['myoverallgrades'].length > 0}
                    <p>
                      <span class="tag is-primary is-large">
                        {student['myoverallgrades'].length} Overall Grades
                      </span>
                       {#if !restricted}
                      <a
                        href="javascript:;"
                        on:click={() => AddOvSGrade(student.degree.id, student.id)}
                        class="button is-success is-rounded">
                        <span class="icon">
                          <i class="fas fa-plus" />
                        </span>
                      </a>
                      {/if}
                    </p>
                    <div class="columns">
                      <div class="column is-one-fifth">
                        <strong>Level</strong>
                      </div>
                      <div class="column is-one-fifth">
                        <strong>Year</strong>
                      </div>
                      <div class="column is-one-fifth">
                        <strong>Grade</strong>
                      </div>
                      <div class="column is-one-fifth" />
                      <div class="column is-one-fifth" />
                    </div>
                  {/if}
                  {#each student['myoverallgrades'] as overallGradeReadObject, i}
                    <div class="columns">
                      <div class="column is-one-fifth">
                        {overallGradeReadObject.studentLevel}
                      </div>
                      <div class="column is-one-fifth">
                        {overallGradeReadObject.year}
                      </div>
                      <div class="column is-one-fifth">
                        {overallGradeReadObject.grade}
                      </div>
                       {#if !restricted}
                      <div class="column is-one-fifth">
                        <a
                          class="button is-success"
                          href="javascript:;"
                          on:click={() => EditOvSGrade(overallGradeReadObject, student.degree.id, student.id)}>
                          <span class="icon is-small">
                            <i class="fas fa-edit" />
                          </span>
                        </a>
                      </div>
                      <div class="column is-one-fifth">
                        <a
                          class="button is-danger"
                          href="javascript:;"
                          on:click={() => DeleteOvSGrade(overallGradeReadObject)}>
                          <span class="icon is-small">
                            <i class="fas fa-trash" />
                          </span>
                        </a>
                      </div>
                      {/if}
                    </div>
                  {/each}
                </div>
                <!-- Student Overall Grade ends  here -->

              </Card>
            </div>
          {:else}
            <p class="subtitle is-5 $subtitle-color: $red">
              {#if searchString.trim().length > 0}
                <div>
                  No Students for the search query {searchString}.
                  <a
                    href="javascript:;"
                    on:click={resetSearch}
                    class="button is-success">
                    Reset Search
                  </a>

                </div>
              {:else}
                <p>No students listed yet.</p>
              {/if}

            </p>
          {/each}

        </div>
      </div>
    </section>
  {:catch error}
    <p style="color: red">{error.message}</p>
  {/await}
  <!-- End of Iteration Students -->

  <!-- Modals -->

  <!-- Student Modal -->
  <div class={modalClass}>
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          {studentObject.firstname ? 'Edit Record for:' + studentObject.firstname : 'Add New Student'}
        </p>
        <button class="delete" aria-label="close" on:click={closeModal} />
      </header>
      <section class="modal-card-body">

        <div class="columns is-desktop">
          <div class="column field">
            <label class="label">Firstname*</label>
            <div class="control">
              <input
                class="input"
                type="text"
                placeholder="Firstname"
                bind:value={studentObject.firstname} />
            </div>
          </div>

          <div class="column field">
            <label class="label">Surname*</label>
            <div class="control">
              <input
                class="input"
                type="text"
                placeholder="Surname"
                bind:value={studentObject.surname} />
            </div>
          </div>
        </div>

        <div class="columns is-desktop">
          <div class="column field">
            <label class="label">GUID</label>
            <div class="control">
              <input
                class="input"
                type="text"
                placeholder=""
                bind:value={studentObject.guid} />
            </div>
          </div>
        </div>

        <div class="columns is-desktop">
          <div class="column field">
            <label class="label">Degree</label>
            <div class="control">
              <DegreeSelection
                multiSelect={false}
                bind:selectedDegrees={studentObject.degreeID} />
            </div>
          </div>

          <div class="column field">
            <label class="label">Level</label>
            <div class="control">
              <LevelSelection bind:selected={studentObject.level} />
            </div>
          </div>
          <div class="column field">
            <label class="label">Entry Year</label>
            <div class="control">
              <YearSelection bind:selected={studentObject.entryYear} />
            </div>
          </div>
        </div>

        <div>
          {#if isDataInvalid}
            <p class="help is-danger">Please enter all the required fields!</p>
          {/if}
        </div>

      </section>
      <footer class="modal-card-foot">
        <button class={buttonSaveClass} on:click={save}>Save changes</button>
        <button class="button" on:click={closeModal}>Cancel</button>
      </footer>
    </div>
  </div>
  <!-- End of Student Modal -->

  <!-- Grade Modal -->
  <div class={modalGradeClass}>
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          {GradeObject.id ? 'Edit Grade: ' : 'Add New Grade'}
        </p>
        <button class="delete" aria-label="close" on:click={closeGradeModal} />
      </header>
      <section class="modal-card-body">

        <div class="columns is-desktop">
          <div class="column field">
            <label class="label">Course*</label>
            <div class="control">
              <CourseSelection
                bind:gradevalue={GradeObject.weight}
                degreeID={GradeObject.degreeID}
                bind:selectedCourse={GradeObject.courseID} />
            </div>
          </div>
        </div>

        <div class="columns is-desktop">
          <div class="column field">
            <label class="label">Weight*</label>
            <div class="control">
              <input
                class="input"
                type="number"
                placeholder="Weight"
                bind:value={GradeObject.weight} />
            </div>
          </div>

          <div class="column field">
            <label class="label">Grade*</label>
            <div class="control">
              <input
                class="input"
                type="number"
                placeholder="Grade"
                bind:value={GradeObject.grade} />
            </div>
          </div>
          <div class="column field">
            <label class="label">Date*</label>
            <div class="control">
              <input
                class="input"
                type="number"
                placeholder="Date"
                bind:value={GradeObject.date} />
            </div>
          </div>
          <div class="column field">
            <label class="label">Status*</label>
            <div class="control">
            <StatusSelection bind:selected={GradeObject.status} />
            </div>
          </div>
        </div>

        <div>
          {#if isGradeDataInvalid}
            <p class="help is-danger">Please enter all the required fields!</p>
          {/if}
        </div>

      </section>
      <footer class="modal-card-foot">
        <button class={buttonGradeSaveClass} on:click={saveGrade}>
          Save changes
        </button>
        <button class="button" on:click={closeGradeModal}>Cancel</button>
      </footer>
    </div>
  </div>
  <!-- End of Grade Modal -->

  <!-- OvSG - Overall Student Grade Modal -->
  <div class={modaloVSGradeClass}>
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">
          {OvSCRUDObject.grade ? 'Edit Overall Grade:  ' : 'Add New Overall Grade'}
        </p>
        <button class="delete" aria-label="close" on:click={closeOvSGModal} />
      </header>
      <section class="modal-card-body">

        <div class="columns is-desktop">
          <div class="column field">
            <label class="label">Level*</label>
            <div class="control">
              <LevelSelection bind:selected={OvSCRUDObject.studentLevel} />
            </div>
          </div>
        </div>

        <div class="columns is-desktop">
          <div class="column field">
            <label class="label">Year*</label>
            <div class="control">
              <YearSelection bind:selected={OvSCRUDObject.year} />
            </div>
          </div>
        </div>

        <div class="column field">
          <label class="label">Grade*</label>
          <div class="control">
            <input
              class="input"
              type="number"
              placeholder="Grade"
              bind:value={OvSCRUDObject.grade} />
          </div>
        </div>

        <div>
          {#if isOvsGDataInvalid}
            <p class="help is-danger">Please enter all the required fields!</p>
          {/if}
        </div>

      </section>
      <footer class="modal-card-foot">
        <button class={buttonOvSGSaveClass} on:click={saveOvSGrade}>
          Save changes
        </button>
        <button class="button" on:click={closeOvSGModal}>Cancel</button>
      </footer>
    </div>
  </div>
  <!-- End of OvSG - Overall Student Grade Modal -->

  <!-- End of Modals -->

  <!-- Delete Modal  -->
  <div class={modalDeleteClass}>
    <div class="modal-background" />
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title is-danger">Delete this record?</p>
        <button class="delete" aria-label="close" on:click={closeDeleteModal} />
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label has-text-danger">
            Are you sure you would like to delete this record?
          </label>
        </div>

        <div>
          {#if DeleteError}
            <p class="help is-danger">{DeleteError}}</p>
          {/if}
        </div>
      </section>

      <footer class="modal-card-foot">
        <button class={buttonDeleteClass} on:click={deleteRecord}>
          Delete
        </button>
        <button class="button" on:click={closeDeleteModal}>Cancel</button>
      </footer>
    </div>
  </div>
  <!-- End of Delete Modal -->
{:else}

	<div class="container" style="display:flex; jusity-content:center">
		<h1 style="font-size: 55px; font-weight: bold; text-align: center; margin:20px" >Please log in to access this part of the database.</h1>
	</div>

{/if}

<footer class="footer">
  <div class="content has-text-centered">
    <p class="has-text-centered">
    School of Chemistry, University of Glasgow
    </p>
  </div>
</footer>

