class AddMapToMarker < ActiveRecord::Migration
  def change
    add_reference :markers, :map, index: true, foreign_key: true
  end
end
