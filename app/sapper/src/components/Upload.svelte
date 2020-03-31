<script>
  
  import { session } from "../stores";
  import { client } from "../gqlClient";
  import { query, mutate } from "svelte-apollo";
  import { gql } from "apollo-boost";
  import  Papa  from 'papaparse'
  import currentYear  from '../currentYear.js'


  let courses = query(client(), {
    query: gql`
      query {
        getCourses {
          id
          courseID
        }
      }
    `
  });

  let course
  let active = false
  let uploadResults 
  let files = []
  let review = []
  let currentyear =currentYear
  let year
  let years=[]
  let loading =false
  let degreelist 
  let componentsActive = [true,false,false,false]
  let componentsDone = [false,false,false,false]
  let weights=[]

  for (let  x= currentyear-3; x <= currentyear+2; x++) {
    years.push(x)
  }

  function readFile(uploadedfile) {
    if(uploadedfile!=null){

    let filenameArray = (uploadedfile["name"]).split(".")
    let type = filenameArray[filenameArray.length -1]

    if( type == "csv") {

      let contents = Papa.parse(uploadedfile,{
        header: true,
        complete: function(results){
           uploadResults = results.data
        }
      })
      }
   else {

  }
    }
  }

 
async function checkGuids() {
  let i = 0
   if(uploadResults==null || year==null || course==null){
     warning = true
     return 0
   }
  
  for(i; i<uploadResults.length; i++) {
    let guid = uploadResults[i].EMPLID
   
    
    if(guid =="") {
      i++
      continue
    }
    let checkNames = await mutate(client(), { mutation: gql`
          mutation {
        checkStudentNames( guid: "${guid}")
     }`
   })
   
    if (!checkNames.data.checkStudentNames){
      let studentObj = uploadResults[i]
       studentObj["degree"] = null
       studentObj["level"] = null

      review.push(studentObj)
    }
  }
  review=review
  goNext()
  }


  let degrees= query(client(), {
    query: gql`
      query {
         getDegrees {
          id
           degreeCode
         }
       }
     `
   })
 $degrees.then(res=>{
   degreelist= res.data.getDegrees
 }) 

 async function listDegrees(){
  return await query(client(), {
    query: gql`
      query {
         getDegrees {
          id
           degreeCode
         }
       }
     `
   })
  
 }

let warning  = false 
let warning2 = false

function saveChanges() {
   let i = 0
   for(i; i<(review).length; i++) {
     if(review[i]['degree']==null || review[i]['level']==null ){
      warning = true 
      return false
    }}
   createStudents()
   return true
}

async function createStudents() {

if(review.length!=0){
 let studentinput = "["
    review.forEach(w => { 
    let names = w['Name'].split(",")
    studentinput += `{ EMPLID: "${w['EMPLID']}",
                      firstname: "${names[1]}",
                      surname: "${names[0]}",
                      degree: "${w['degree']}",
                      level: ${w['level']}
                      },`
     })
    studentinput = studentinput.substring(0, studentinput.length-1) // removes the last comma
    studentinput += "]"

    let created = await mutate(client(),{mutation: gql`
      mutation {
        createStudentByUpload(
          students: ${studentinput}
          entryYear: ${year}
        ){
          failed
        }
        
      }`
    })
  
 
}
}



async function goNext(){
  let i = 0
  for(i; i<3;i++){
  if (componentsActive[i]){
    if(i==0){
      if(uploadResults==null || year==null || course==null){
        warning = true 
        break
      }else{
      for(let y=0; y<degreelist.length; y++){
       
        let weightpromise = await getWeights(degreelist[y].id,course.id)
        weightpromise.result().then(res=>{
         
          if(res.data.getWeight==null || res.data.getWeight.length<=0 ){

            warning2 =  true
          }else{
            
           
            let id = degreelist[y]['id']
            let course_weight =  res.data.getWeight[0].weight
            weights.push({degree: id, weight: course_weight})
        }
      })
    }
    }
    }

    if(i==1){
      let checkfields=saveChanges()
      if (!checkfields) {
        warning=true
        break
      }
    }
    componentsActive[i]=false
    componentsActive[i+1] = true
    componentsDone[i] = true
    warning=false
    
    break
  }
}
}

async function getWeights(degreeid, courseid){
  return await query(client(), {
    query: gql`
      query {
        getWeight(degree: "${degreeid}", course: "${courseid}") {
          weight
        }
      }
    `
  });
}
let failed =[]
async function uploadGrades(){
    let weightsInput = "["
    weights.forEach(w => {
    weightsInput += `{degree: "${w.degree}", weight: ${w.weight}},`
     })
    weightsInput = weightsInput.substring(0, weightsInput.length-1) // removes the last comma
    weightsInput += "]"
    let studentsInput = "["
    uploadResults.forEach(w => {
      if(w.EMPLID!=""){
    studentsInput += `{EMPLID: "${w.EMPLID}", Name: "${w.Name}", Grade: "${w.Grade}"},`
    }
     })
    studentsInput = studentsInput.substring(0, studentsInput.length-1) // removes the last comma
    studentsInput += "]"
    
 
     
     let failedGrades = await mutate(client(),{mutation: gql`
       mutation {
         addGrade(
           course: "${course.id}"
           year: ${year}
           weights: ${weightsInput}
           studentlist: ${studentsInput}
        ){
          failed
          }
       }`
       
     })
         failed = failedGrades.data.addGrade.failed

         if(failed.length != 0){
            warning2 = true
        }
        goNext()
}

function resetFile() { 
            const file = 
                document.querySelector('.file-input'); 
            file.value = ''; 
        } 
function resetSelect() { 
            const select = 
                document.querySelector('.select'); 
            select.value = ''; 
        } 
function clearAll(){
  if (!componentsActive[0]){
    course=null
    year=null
   
  }else{
  resetFile()}
  warning = false
  active = false
  warning2 = false
  weights=[]
  componentsActive[0] = true
  componentsActive[1] = false
  componentsActive[2] = false
  componentsActive[3] = false
  componentsDone = [false,false,false,false]
  uploadResults = null
  review = []
  loading = false
  failed = []
  
}


</script>

<div>
  <button class="button modal-button is-info" on:click={() => (active = true)}>
    Upload Grades
  </button>
</div>

<div class:is-active={active} class="modal">
  <div class="modal-background" />
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Upload Grades</p>
      <button class="delete" on:click={() =>clearAll()} aria-label="close" />
    </header>

    <section class="modal-card-body has-text-black">

        <div class="steps">
  <div class:is-active={componentsActive[0]} class:is-completed={componentsDone[0]} class="step-item">
    <div class="step-marker">1</div>
    <div class="step-details">
      <p>Upload File</p>
    </div>
  </div>
  <div class:is-active={componentsActive[1]} class:is-completed={componentsDone[1]} class="step-item">
    <div class="step-marker">2</div>
    <div class="step-details">
      <p>Review Entries</p>
    </div>
  </div>
  <div class:is-active={componentsActive[2]} class:is-completed={componentsDone[2]} class="step-item">
    <div class="step-marker">3</div>
    <div class="step-details">
      <p>Upload Grades</p>
    </div>
  </div>
  <div class:is-active={componentsActive[3]} class:is-completed={componentsDone[3]} class="step-item">
    <div class="step-marker">
      <span class="icon">
        <i class="fa fa-flag"></i>
      </span>
    </div>
    <div class="step-details">
      <p>Save Changes</p>
    </div>
  </div>
</div>
    
   {#await $courses} 
      <p>Loading courses</p>
    {:then result} 
   {#if componentsActive[0]}
    <div>
    <div class="box"> Please upload files that have data in columns EMPLID, Name and Grade.</div>
    <div class="columns">
      <div class="column is-2 is-offset-2"> Course: </div>
        <div class="column is-4 ">
        <div class="select is-primary ">
        <select class="selecting" bind:value={course}>
         <option value="" disabled selected>Select a course</option>
          {#each result.data.getCourses as listCourse}
            <option value={listCourse}>{listCourse.courseID}</option>
          {/each}
        </select>
        </div>
         </div>
         </div>
 

       <div class="columns">
       <div class="column is-2 is-offset-2">Year: </div>
        <div class="column is-4">
        <div class="select is-primary">
        <select class="selecting" bind:value={year}>
         <option value="" disabled selected>Select a year</option>
          {#each years as yearid}
            <option value={yearid}>{yearid}-{yearid+1}</option>
          {/each}
        </select>
        </div>
        </div>
       </div>

       <div class="columns">
       <div class="column is-2 is-offset-2">
       <p>File: </p>
       </div>
        <div class="column is-4">

        <div class="file is-primary">
  <label class="file-label">
   <input

          bind:files
          type="file"
          class="file-input"
          accept=".csv"
          on:change={()=>readFile(files[0])}
          />
          
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label">
        Choose a file…
      </span>
    </span>
  </label>
</div>
    </div>
        </div>
       
        
        {#if warning}
        <p class="box has-background-warning">Please upload a file</p>
        {/if}

    </div>
   {/if}

    {#if componentsActive[1]}
    

    
        
        {#if review.length>0}
        {#if warning2}
      <div class="box has-background-warning has-text-white"> 
      Some of the Degrees in the Database do not have default weight associated with 
      this course. This could potentially affect the upload of students.</div>
      {/if}
        <div class="box has-background-warning">
        <p>The following students are not in the current database:</p>
        <p>Please provide additional data for each of them before submiting grades.</p>
        </div>

        <table class="table">
        {#each review as entry}
        <tr>
        <td>{entry.EMPLID}</td> <td>{entry.Name}</td>
        <td>
        <div class="select is-primary is-small">
        <select class="select" bind:value={entry.degree}>
        <option value="" disabled selected>Select Degree</option>
            {#each degreelist as Degree}
                <option value={Degree.id}>{Degree.degreeCode}</option>
            {/each}
            </select>
            </div>
            </td>
             <td>
            <div class="select is-primary is-small">
            <select class="select" bind:value={entry.level}>
            <option value="" disabled selected>Select Year</option>
            <option value='Third'>Third</option>
            <option value='Fourth'>Fourth</option>
            <option value='Fifth'>Fifth</option>
            </select>
            </div>
            </td>
        </tr>
        {/each}
        </table>

        {#if warning}
        <div class="box has-background-warning">
            <p>Please choose degrees for all students</p>
        </div>
        {/if}
    {:else}
        <div class="content has-text-centered" > All students are in the database. Go to next stage. </div>
    {/if}
   {/if}

    {#if componentsActive[2]}
        <div class="content has-text-centered">
        Data for:
         <b>{course.courseID}</b>/ <b>{year}-{year+1}</b>/ <b>{files[0]["name"]}</b>
        </div>
        <div>Ready for uploading grades.</div>

        
        
    {/if}

    {#if componentsActive[3]}
        
        {#if warning2 }
        <div class="box has-background-danger has-text-white"> 
        Warning! An error occured when uploading grades.
        Please check if the following students have grades in the database for the current course and year.
        {#each failed as failedStudent}
        <p class="has-text-weight-bold">Student id: {failedStudent}</p>
        {/each}
        </div>
        {:else}
        <div>Upload completed. No issues found.</div>
        {/if}
    {/if}
   
      {/await}
      </section>
     

    <footer class="modal-card-foot">
    <button class="button" on:click={() => clearAll()}>Cancel</button>
    {#if componentsActive[0]}
    <button class="button is-success" on:click={() => checkGuids()}>Upload</button>
    {/if}
    {#if componentsActive[1]}
    <button class="button is-success" on:click={() => goNext()}>Next</button>
    {/if}
    {#if componentsActive[2]}
    <button class="button is-success" on:click={()=>uploadGrades()}>Upload Grades</button>
     
    {/if}
    {#if componentsActive[3]}
    <button class="button is-success" on:click={()=>clearAll()}>Finish</button>
  
    {/if}
    
     
    </footer>

  </div>
</div>
