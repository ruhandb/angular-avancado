import { Component, OnInit, AfterContentChecked } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { Category } from "../shared/category.model";
import { CategoryService } from "../shared/category.service";

import { switchMap } from "rxjs/operators";

import toastr from "toastr";

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit {

  currentAction: string;
  categoryForm: FormGroup;
  pageTitle: string;
  serverErrorMessages: string[] = null;
  submitingForm: boolean = false;
  category: Category = new Category();

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private formbuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.setCurrentAction();
    this.builCategoryForm();
    this.loadCategory();
  }

  ngAfterContentChecked(){
    this.setPageTitle();
  }

  submitForm(){
    this.submitingForm = true;
    if(this.currentAction == 'new'){
      this.createCategory();
    }else{ // this.currentAction == 'edit'
      this.updateCategory();
    }
  }

  private setCurrentAction(){
    if(this.route.snapshot.url[0].path == 'new'){
      this.currentAction = "new"
    }else{
      this.currentAction = "edit"
    }
  }

  private builCategoryForm(){
    this.categoryForm = this.formbuilder.group({
      id: [null],
      name: [null, [Validators.required, Validators.minLength(2)]],
      description: [null]
    });
  }

  private loadCategory(){
    if(this.currentAction == 'edit'){
      this.route.paramMap.pipe(
        switchMap(params => this.categoryService.getById(+params.get('id')))
      )
      .subscribe(
        category => {
          this.category = category;
          this.categoryForm.patchValue(category); // bind loaded category to categoryFrom
        },
        error => alert('Ocorreu um erro no servidor: ' + error)
      )
    }
  }

  private setPageTitle() {
    if (this.currentAction == 'new') {
      this.pageTitle = 'Cadastro de Nova Categoria';
    } else {
      const categoryName = this.category.name || '';
      this.pageTitle = 'Editando Categoria: ' + categoryName;
    }
  }

  private createCategory() {
    const category: Category = Object.assign(new Category(), this.categoryForm.value);

    this.categoryService.create(category)
      .subscribe(
        category => this.actionsForSuccess(category),
        error => this.actionForError(error)
      );
  }

  private updateCategory() {
    const category: Category = Object.assign(new Category(), this.categoryForm.value);

    this.categoryService.update(category)
      .subscribe(
        category => this.actionsForSuccess(category),
        error => this.actionForError(error)
      );
  }

  private actionsForSuccess(category: Category) {
    toastr.success('Solicitação solicitada com sucesso!');
    
    // redirect/reload component page
    this.router.navigateByUrl('categories', { skipLocationChange: true })
      .then(
        () => this.router.navigate(['categories', category.id, 'edit'])
      );
    
  }

  private actionForError(error) {
    toastr.error('Ocorreu um erro ao processar a sua solicitação!');

    this.submitingForm = false;

    if(error.status === 422){
      this.serverErrorMessages = JSON.parse(error._body).errors;
    }else{
      this.serverErrorMessages = ['Falha na comuniação com o servidor. Por favor, tente mais tarde!'];
    }
  }

}
