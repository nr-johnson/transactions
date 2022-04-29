function toggleTransForm(event) {
    if(event) event.preventDefault()
    const form = document.getElementById('newTransForm')
    form.classList.contains('show') ? form.removeChild(form.children[1]) : loadForm(form)

    form.classList.toggle('show')
}

function loadForm(form) {
    const template = document.getElementById('formTemplate')
    const nodes = template.content.cloneNode(true);
    let content = nodes.children[0]

    form.append(content)
}

function validateForm(event, form) {
    event.preventDefault()
    let fields = document.querySelectorAll('.field')
    let errors = []
    fields.forEach(field => {
        field.classList.remove('error')
        field.name == 'date' && field.value == '' ? errors.push({input: field, message: 'Date must be set'}) : null
        field.name == 'payee' && field.value == '' ? errors.push({input: field, message: 'Payee cannot be empty'}) : null
        field.name == 'amount' && field.value == '' ? errors.push({input: field, message: 'Transaction Amount must be set'}) : 
            field.name == 'amount' && !parseInt(field.value) ? errors.push({input: field, message: 'Transaction Amount must be a number'}) : null
        field.name == 'source' && field.value == '' ? errors.push({input: field, message: 'Transaction Source cannot be empty'}) : null
    })
    if(errors.length > 0) {
        const div = document.createElement('div')
        div.innerHTML = '<h4>Oops...</h4>'

        const ul = document.createElement('ul')

        for(let index in errors) {
            const li = document.createElement('li')
            li.innerHTML = errors[index].message
            ul.append(li)
            errors[index].input.classList.add('error')
        }
        div.append(ul)
        myAlert(div.innerHTML)
    } else {
        submitForm(form)
    }
}

function checkImages(input) {
    let text = input.parentNode.parentNode.children[1].children[0]
    input.parentNode.children[0].classList.remove('error')
    for(i = 0; i < input.files.length; i++) {
        const file = input.files[i]
        const extension = file.name.split('.')[1]
        if(extension != 'jpg' && extension != 'jpeg' && extension != 'png') {
            input.parentNode.children[0].classList.add('error')
            input.value = null
            text.innerHTML = 'No image(s) selected.'
            alert('Images must be jpegs or pngs.')
            break
        }
        if(file.size > 2000000) {
            input.parentNode.children[0].classList.add('error')
            input.value = null
            text.innerHTML = 'No image(s) selected.'
            alert('Image sizes cannot excede 2mb.')
            break
        }
    }


    input.files.length < 1 ? text.innerHTML = 'No image(s) selected.' :
    input.files.length < 2 ? text.innerHTML = input.files[0].name :
    text.innerHTML = `${input.files.length} images selected.`
}

async function login(event, form) {
    event.preventDefault()
    let data = new FormData(form)
    // const data = {"password": document.getElementById('password').value}
    let submit = await TTS('POST', '/login', data)
    submit = JSON.parse(submit)
    submit.ok ? window.location.href = '/' : alert(submit.resp)
}

async function logout(event) {
    event.preventDefault()
    await TTS('POST', '/login/logout')
    window.location.href="/login"
}

async function submitForm(form) {
    let but = document.getElementById('saveButton')
    but.classList.add('loading')
    let data = new FormData(form)
    let submit = await TTS('POST', '/api/add', data)
    let resp = JSON.parse(submit)
    if(resp.ok){
        myAlert('Transaction Uploaded!')
        toggleTransForm(null)
        window.setTimeout(() => closeMyAlert(null), 3000)
        setTimeout(() => window.location.reload(), 2000)
    } else {
        myAlert(`Error:<br>${resp.resp}`)
    }
    but.classList.remove('loading')
}

async function fetchTrans(but, count) {
    but.classList.add('loading')
    try {
        let parent = document.getElementById('transactions')
        const transactions = await TTS('GET', `/api/fetch?current=${parent.children.length}&get=${count}`)
        const data = JSON.parse(transactions)
        
        if(data.ok) {
            for(let index in data.resp) {
                let trans = data.resp[index]
                let template = document.getElementById('transTemplate')
                const nodes = template.content.cloneNode(true);
                let content = nodes.children[0]
    
                content.id = trans._id
    
                content.children[1].innerHTML = new Date(trans.date).toLocaleDateString('en-us', {year:"numeric", month:"long", day:"numeric"})
                content.children[2].setAttribute('onclick', `showDetails("${trans._id}")`)
                content.children[2].innerHTML = `${trans.payee} - $${trans.amount}`
    
                parent.appendChild(content)
            }
    
            if(data.limit) {
                but.classList.add('disabled')
                but.innerHTML = 'End of Transactions'
            }
        } else {
            myAlert(data.resp)
        }
        

    } catch(err) {
        myAlert(err.message)
    }
    but.classList.remove('loading')
}

function deleteTransaction(id) {
    const mainDiv = document.createElement('div')

    const div = document.createElement('div')
    div.classList = 'col-8 mx-auto justify-content-center text-center my-3 confirmDelete'
    
    const btn = document.createElement('a')
    btn.setAttribute('onclick', `confirmDelete("${id}")`)
    btn.classList = "btn btn-caution mt-3 col-12 col-md-6"
    btn.innerHTML = "Confirm"
    
    div.innerHTML = "<div>Are you sure you want to delete this transaction?</div>"
    div.append(btn)

    mainDiv.append(div)

    myAlert(mainDiv.innerHTML)
}

async function confirmDelete(id) {
    await TTS('POST', `/api/delete/${id}`)
    const trans = document.getElementById(id)
    trans.parentNode.removeChild(trans)
    myAlert('Transaction Deleted')
}

function TTS(method, route, data) {
    // TTS = Talk To Server
    return new Promise(resolve => {
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && (this.status == 200 || this.status == 201)) {
                resolve(this.response)
            }
        };
        
        xhttp.open(method, route);
        if(data) {
            xhttp.send(data)
        } else {
            xhttp.send()
        }
    })
    

}

async function showDetails(id) {
    const trans = await TTS('GET', `/api/gettransaction/${id}`)
    const data = JSON.parse(trans).resp

    const template = document.getElementById('detailsTemplate')
    const nodes = template.content.cloneNode(true);
    let content = nodes.children[0]

    content.children[2].innerHTML = new Date(data.date).toLocaleDateString('en-us', {year:"numeric", month:"long", day:"numeric"})
    content.children[3].innerHTML = data.payee
    content.children[4].innerHTML = `$${data.amount}`
    content.children[5].innerHTML = data.source

    if(data.checkNumber != "" && data.checkNumber.toLowerCase() != 'na') {
        content.children[6].innerHTML = data.checkNumber
    } else {
        content.children[6].innerHTML = ""
        content.children[6].classList.add('d-none')
    }

    if(data.notes != "") {
        content.children[7].innerHTML = data.notes
    } else {
        content.children[7].innerHTML = ""
        content.children[7].classList.add('d-none')        
    }
    

    for(let index in data.images) {
        const image = data.images[index]

        let cont = document.createElement('a')
        cont.classList = 'detailsImageCont'
        cont.href = image.url
        cont.setAttribute('target', '_blank')

        let node = document.createElement('img')
        node.src = image.url
        node.classList = 'detailsImage'

        cont.append(node)
        content.children[9].appendChild(cont)
    }
    content.children[10].children[0].children[0].setAttribute('onclick', `deleteTransaction("${data._id}")`)
    content.children[11].innerHTML = `ID: ${data._id}`


    myAlert(content.innerHTML)

}

function myAlert(content) {
    const box = document.getElementById('myAlert')
    const container = document.getElementById('myAlertContent')
    
    container.children[1].innerHTML = content
    box.classList.add('show')
}
function closeMyAlert(event) {
    if(event) event.preventDefault()
    const box = document.getElementById('myAlert')
    const container = document.getElementById('myAlertContent')

    setTimeout(() => container.children[1].innerHTML = '', 250)
    box.classList.remove('show')
}