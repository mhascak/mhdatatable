<template>
        <ul class="mh-menu mh-control">
        <li class="mh-menu__item">
            <span class="cIcon left mh-icon icon-pin"></span>
            <span class="cName">{{ $i18nForDatatable('Pin Column') }}</span>
            <span class="cIcon mh-icon icon-right-open"></span>
            <ul class="mh-menu--submenu">
                <li class="mh-menu__item">
                    <span class="cName">{{ $i18nForDatatable('No pin') }}</span>
                </li>
            </ul>
        </li>
        <li class="mh-menu__item mh-separator--top">
            <span class="cName">{{ $i18nForDatatable('Auto size This Column') }}</span>
        </li>
        <li class="mh-menu__item" >
            <span class="cName">{{ $i18nForDatatable('Auto size All Columns') }}</span>
        </li>
        <li class="mh-menu__item mh-separator--top" >
            <span class="cName">{{ $i18nForDatatable('Reset columns') }}</span>
        </li>
        <li class="mh-menu__item mh-separator--top" >
            <span class="cName">{{ $i18nForDatatable('Reset all filters') }}</span>
        </li>
    </ul>
</template>

<script>
export default {
  name: 'ContextMenuActions',
  props: ['row', 'column']
}
</script>