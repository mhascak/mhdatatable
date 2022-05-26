export default {
  props: {
    leftFixed: {
      type: Boolean,
      default: false
    },
    rightFixed: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    selectionHasFixedColumn(){
       return this.columns.some(col => col.fixed || col.fixed === 'right' || col.fixed === 'left')
    },
    shouldRenderSelection() {

      if(this.selectionHasFixedColumn === true){
        if (this.rightFixed === false && this.leftFixed === true && this.selection && this.showSelection === true) {
          return true
        } else if (this.rightFixed === false && this.leftFixed === false) {
          return false
        } else {
          return false
        }
      } else {
        if(this.selection && this.showSelection === true){
          return true;
        }else{
          return false;
        }
      }
    }
  }
}
